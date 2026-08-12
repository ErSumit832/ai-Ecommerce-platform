# Backend — AI-Powered E-Commerce Platform API

FastAPI + PostgreSQL + Redis-ready backend. Covers auth, catalog, cart, wishlist,
checkout/orders, reviews, admin dashboard, and 5 AI features (recommendations,
shopping chat assistant, review summarizer, sales analytics insight, incident
analysis) using OpenAI or Anthropic.

## 1. Local setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit .env with your real values
```

You need a running PostgreSQL instance matching `DATABASE_URL` in `.env`.
Quickest way locally:

```bash
docker run --name ecommerce-postgres -e POSTGRES_USER=ecommerce_user \
  -e POSTGRES_PASSWORD=ecommerce_pass -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 -d postgres:16
```

(Redis is referenced in config for future caching/session use — not required
for the app to boot today.)

## 2. Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

Tables are auto-created on first boot via `Base.metadata.create_all`. Swagger
docs: http://localhost:8000/docs

## 3. Seed demo data (categories, products, admin user)

```bash
python -m scripts.seed_data
```

Creates an admin login: `admin@ecommerce.local` / `Admin123!`

## 4. Enable AI features

Set **one** of these in `.env`:

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
or
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key configured, AI endpoints still respond (no 500 errors) with a
graceful fallback message/heuristic result, so the rest of the app keeps working.

## 5. Folder structure

```
backend/
  app/
    core/        # settings, JWT/password security, auth dependencies
    db/          # SQLAlchemy engine/session + all ORM models
    schemas/     # Pydantic request/response models
    routers/     # auth, products, cart, orders, reviews, ai, admin
    services/    # ai_service.py — OpenAI/Anthropic abstraction
    main.py      # FastAPI app + router registration
  scripts/
    seed_data.py
  requirements.txt
  .env.example
```

## 6. Key endpoints

| Area | Endpoint |
|---|---|
| Auth | `POST /api/v1/auth/register`, `/login`, `/refresh`, `GET /me` |
| Products | `GET /api/v1/products` (search/filter/sort/paginate), `POST/PUT/DELETE` (admin) |
| Cart | `GET/POST /api/v1/cart`, `PUT/DELETE /api/v1/cart/items/{id}` |
| Wishlist | `GET/POST/DELETE /api/v1/wishlist` |
| Orders | `POST /api/v1/orders/checkout`, `GET /api/v1/orders`, admin status update |
| Reviews | `GET/POST /api/v1/products/{id}/reviews`, `GET .../ai-summary` |
| AI | `POST /api/v1/ai/recommend`, `/chat`, `GET /sales-analytics`, `POST /incident-analysis` |
| Admin | `GET /api/v1/admin/dashboard`, `/users`, `/inventory/low-stock` |
