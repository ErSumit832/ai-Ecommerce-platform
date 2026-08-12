"""
All SQLAlchemy ORM models: users, catalog, cart, wishlist, orders, reviews, AI logs.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CUSTOMER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    compare_at_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    brand: Mapped[str] = mapped_column(String(100), default="")
    tags: Mapped[str] = mapped_column(String(500), default="")  # comma separated, used for AI matching
    rating_avg: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    category: Mapped["Category"] = relationship(back_populates="products")
    reviews: Mapped[list["Review"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    user: Mapped["User"] = relationship(back_populates="cart_items")
    product: Mapped["Product"] = relationship()


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="wishlist_items")
    product: Mapped["Product"] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    shipping_address: Mapped[str] = mapped_column(String(500), default="")
    tracking_number: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(200))  # snapshot at purchase time
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    product: Mapped["Product"] = relationship(back_populates="reviews")
    user: Mapped["User"] = relationship(back_populates="reviews")


class AIChatLog(Base):
    """Stores AI shopping-assistant conversations for analytics + incident review."""
    __tablename__ = "ai_chat_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(20))  # "user" | "assistant"
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
