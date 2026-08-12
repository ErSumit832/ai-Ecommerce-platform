import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.database import get_db
from app.db.models import Category, Product
from app.schemas.product import CategoryOut, ProductCreate, ProductListResponse, ProductOut, ProductUpdate

router = APIRouter(prefix="/api/v1/products", tags=["Products"])
categories_router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


@router.get("", response_model=ProductListResponse)
def list_products(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, description="Free text search over name/brand/tags"),
    category_slug: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc|rating)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
):
    stmt = select(Product).where(Product.is_active.is_(True))

    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.brand.ilike(like), Product.tags.ilike(like)))
    if category_slug:
        stmt = stmt.join(Category).where(Category.slug == category_slug)
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)

    if sort == "price_asc":
        stmt = stmt.order_by(Product.price.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Product.price.desc())
    elif sort == "rating":
        stmt = stmt.order_by(Product.rating_avg.desc())
    else:
        stmt = stmt.order_by(Product.created_at.desc())

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    return ProductListResponse(items=items, total=total or 0, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=201, dependencies=[Depends(get_current_admin)])
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    slug = slugify(payload.name)
    if db.scalar(select(Product).where(Product.slug == slug)):
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"  # ensure uniqueness on collision

    product = Product(**payload.model_dump(), slug=slug)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut, dependencies=[Depends(get_current_admin)])
def update_product(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(get_current_admin)])
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()


@categories_router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@categories_router.post("", response_model=CategoryOut, status_code=201, dependencies=[Depends(get_current_admin)])
def create_category(name: str, db: Session = Depends(get_db)):
    slug = slugify(name)
    if db.scalar(select(Category).where(Category.slug == slug)):
        raise HTTPException(status_code=400, detail="Category already exists")
    category = Category(name=name, slug=slug)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
