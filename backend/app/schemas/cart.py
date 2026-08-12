from pydantic import BaseModel, Field

from app.schemas.product import ProductOut


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, default=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    id: str
    product: ProductOut
    quantity: int
    line_total: float

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: float
    item_count: int


class WishlistItemOut(BaseModel):
    id: str
    product: ProductOut

    model_config = {"from_attributes": True}
