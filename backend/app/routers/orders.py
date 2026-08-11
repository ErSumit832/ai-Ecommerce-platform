import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_admin, get_current_user
from app.db.database import get_db
from app.db.models import CartItem, Order, OrderItem, OrderStatus, Product, User
from app.schemas.order import CheckoutRequest, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.post("/checkout", response_model=OrderOut, status_code=201)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cart_items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    for ci in cart_items:
        if ci.product.stock_quantity < ci.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {ci.product.name}")

    total = sum(float(ci.product.price) * ci.quantity for ci in cart_items)

    order = Order(
        user_id=user.id,
        status=OrderStatus.PAID,  # simplified: assume payment succeeds (plug a real gateway here)
        total_amount=round(total, 2),
        shipping_address=payload.shipping_address,
        tracking_number=f"TRK-{uuid.uuid4().hex[:10].upper()}",
    )
    db.add(order)
    db.flush()  # get order.id before inserting items

    for ci in cart_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=ci.product_id,
            product_name=ci.product.name,
            unit_price=ci.product.price,
            quantity=ci.quantity,
        ))
        ci.product.stock_quantity -= ci.quantity
        db.delete(ci)

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def list_my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(Order).options(joinedload(Order.items)).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    ).unique().all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.get(Order, order_id)
    if not order or (order.user_id != user.id and user.role.value != "admin"):
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/admin/all", response_model=list[OrderOut], dependencies=[Depends(get_current_admin)])
def admin_list_orders(db: Session = Depends(get_db)):
    return db.scalars(select(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())).unique().all()


@router.patch("/admin/{order_id}/status", response_model=OrderOut, dependencies=[Depends(get_current_admin)])
def admin_update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        order.status = OrderStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")
    if payload.tracking_number:
        order.tracking_number = payload.tracking_number
    db.commit()
    db.refresh(order)
    return order
