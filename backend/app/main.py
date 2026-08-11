"""
Application entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Docs available at /docs (Swagger) and /redoc.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine
from app.routers import admin, ai, auth, cart, orders, products, reviews

# Creates tables if they don't exist yet. For production, prefer Alembic migrations
# (see backend/alembic/) instead of relying on this.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Cloud-Native E-Commerce Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(products.categories_router)
app.include_router(cart.router)
app.include_router(cart.wishlist_router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(ai.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": settings.APP_NAME, "environment": settings.ENVIRONMENT}


@app.get("/healthz", tags=["Health"])
def healthz():
    """Liveness/readiness probe endpoint for Kubernetes."""
    return {"status": "healthy"}
