from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import CartItem, Product, User, WishlistItem
from app.schemas.cart import CartItemAdd, CartItemOut, CartItemUpdate, CartOut, WishlistItemOut

router = APIRouter(prefix="/api/v1/cart", tags=["Cart"])
wishlist_router = APIRouter(prefix="/api/v1/wishlist", tags=["Wishlist"])


def _build_cart_out(items: list[CartItem]) -> CartOut:
    out_items = [
        CartItemOut(id=i.id, product=i.product, quantity=i.quantity, line_total=round(float(i.product.price) * i.quantity, 2))
        for i in items
    ]
    subtotal = round(sum(i.line_total for i in out_items), 2)
    return CartOut(items=out_items, subtotal=subtotal, item_count=sum(i.quantity for i in out_items))


@router.get("", response_model=CartOut)
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    return _build_cart_out(items)


@router.post("/items", response_model=CartOut, status_code=201)
def add_to_cart(payload: CartItemAdd, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    product = db.get(Product, payload.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock_quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    existing = db.scalar(
        select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == payload.product_id)
    )
    if existing:
        existing.quantity += payload.quantity
    else:
        db.add(CartItem(user_id=user.id, product_id=payload.product_id, quantity=payload.quantity))
    db.commit()

    items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    return _build_cart_out(items)


@router.put("/items/{item_id}", response_model=CartOut)
def update_cart_item(item_id: str, payload: CartItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(CartItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = payload.quantity
    db.commit()

    items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    return _build_cart_out(items)


@router.delete("/items/{item_id}", response_model=CartOut)
def remove_cart_item(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(CartItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()

    items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    return _build_cart_out(items)


# ---- Wishlist ----

@wishlist_router.get("", response_model=list[WishlistItemOut])
def get_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(WishlistItem).options(joinedload(WishlistItem.product)).where(WishlistItem.user_id == user.id)
    ).all()


@wishlist_router.post("/{product_id}", response_model=WishlistItemOut, status_code=201)
def add_to_wishlist(product_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.scalar(
        select(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)
    )
    if existing:
        return existing

    item = WishlistItem(user_id=user.id, product_id=product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@wishlist_router.delete("/{item_id}", status_code=204)
def remove_from_wishlist(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(WishlistItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    db.delete(item)
    db.commit()
