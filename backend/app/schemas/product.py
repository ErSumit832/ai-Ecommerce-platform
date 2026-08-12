from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str = ""
    price: float = Field(gt=0)
    compare_at_price: Optional[float] = None
    stock_quantity: int = Field(ge=0, default=0)
    image_url: str = ""
    brand: str = ""
    tags: str = ""
    category_id: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None
    tags: Optional[str] = None
    category_id: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    price: float
    compare_at_price: Optional[float]
    stock_quantity: int
    image_url: str
    brand: str
    tags: str
    rating_avg: float
    rating_count: int
    is_active: bool
    created_at: datetime
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
