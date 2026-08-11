from datetime import datetime

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    shipping_address: str


class OrderItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    unit_price: float
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: str
    status: str
    total_amount: float
    shipping_address: str
    tracking_number: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: str | None = None
