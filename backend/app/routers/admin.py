from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.database import get_db
from app.db.models import Order, Product, User

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])


@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db)):
    return {
        "total_users": db.scalar(select(func.count(User.id))) or 0,
        "total_products": db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))) or 0,
        "total_orders": db.scalar(select(func.count(Order.id))) or 0,
        "total_revenue": float(db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0))) or 0),
        "low_stock_products": db.scalar(select(func.count(Product.id)).where(Product.stock_quantity < 10)) or 0,
    }


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [
        {"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role.value,
         "is_active": u.is_active, "created_at": u.created_at}
        for u in users
    ]


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/inventory/low-stock")
def low_stock_products(db: Session = Depends(get_db), threshold: int = 10):
    products = db.scalars(select(Product).where(Product.stock_quantity < threshold)).all()
    return [{"id": p.id, "name": p.name, "stock_quantity": p.stock_quantity} for p in products]
