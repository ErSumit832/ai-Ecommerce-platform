# Circuitry — AI-Powered Cloud-Native E-Commerce Platform

A full-stack e-commerce application for engineering/DevOps hardware, with five
AI features built on OpenAI and Anthropic. Built as a portfolio-grade
reference project — application layer is complete and runnable; deployment
tooling (Docker, Kubernetes, Terraform, Jenkins, ArgoCD, EKS) is left for you
to build on top, by design.

> This repo currently contains the **application code only**: React/Tailwind
> frontend, FastAPI backend, PostgreSQL data layer, and AI feature integration.
> No Dockerfiles, Kubernetes manifests, or CI/CD pipelines are included yet —
> that's the intended next phase of this project, built by hand rather than
> generated, since that's the DevOps skillset this project is meant to showcase.

---

## 1. Project overview

**Circuitry** sells laptops, monitors, and infrastructure gear aimed at
engineers. Beyond a standard storefront (catalog, cart, checkout, order
tracking, reviews, admin dashboard), it layers in AI throughout the shopping
and operations experience:

| Feature | What it does | Where |
|---|---|---|
| AI Product Recommendation | "I need a laptop for DevOps" → matched products + explanation | Home page hero |
| AI Shopping Assistant | Conversational chat, terminal-styled widget on every page | Global widget |
| AI Review Summarizer | Summarizes a product's reviews into a summary + pros/cons | Product detail page |
| AI Sales Analytics | Revenue/order trends + a plain-English AI insight | Admin dashboard |
| AI Incident Assistant | Paste a stack trace → root cause, severity, suggested fixes | Admin dashboard |

## 2. Architecture

```
                    ┌─────────────────────┐
                    │   React + Tailwind   │
                    │   (Vite dev server /  │
                    │    static build)       │
                    └──────────┬───────────┘
                               │ REST (JSON) + JWT
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI backend     │
                    │  auth · catalog ·      │
                    │  cart · orders ·        │
                    │  reviews · admin        │
                    └──────┬───────┬────────┘
                           │       │
              SQLAlchemy   │       │  OpenAI / Anthropic SDK
                           ▼       ▼
                 ┌──────────────┐ ┌────────────────┐
                 │  PostgreSQL   │ │  AI provider     │
                 │  (catalog,     │ │  (chat, summar-   │
                 │  users, orders)│ │  ization, insight) │
                 └──────────────┘ └────────────────┘
```

See `docs/ARCHITECTURE.md` for the fuller breakdown, including where Redis,
Docker, and Kubernetes are intended to slot in once you build that layer.

## 3. Repo structure

```
ecommerce-ai/
  backend/          # FastAPI + PostgreSQL + AI service layer
  frontend/          # React + Vite + Tailwind
  docs/               # Architecture notes, interview prep
```

Each of `backend/` and `frontend/` has its own README with detailed setup
instructions. This file is the entry point that ties them together.

## 4. Quick start

You need Python 3.11+, Node 18+, and a PostgreSQL instance.

```bash
# 1. Database
docker run --name ecommerce-postgres -e POSTGRES_USER=ecommerce_user \
  -e POSTGRES_PASSWORD=ecommerce_pass -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 -d postgres:16

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add your OPENAI_API_KEY or ANTHROPIC_API_KEY
python -m scripts.seed_data  # demo products + admin login
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                  # http://localhost:5173
```

Demo admin login: `admin@ecommerce.local` / `Admin123!`

## 5. AI features setup

Both AI providers are supported behind one switch in `backend/.env`:

```
AI_PROVIDER=openai            # or "anthropic"
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key configured, every AI endpoint still responds (no crashes) with
a graceful fallback — useful for demoing the rest of the app without a live
key, or for interviews where you want to show the degrade-gracefully design
choice explicitly.

## 6. Security notes (as shipped)

- Passwords hashed with bcrypt via `passlib`.
- JWT access + refresh tokens; access tokens are short-lived, refresh flow is
  automatic in the frontend axios client.
- Role-based access control (`customer` / `admin`) enforced at the FastAPI
  dependency layer, not just in the UI.
- CORS is explicitly configured (`CORS_ORIGINS`) rather than left wide open.
- Secrets live in `.env` files (gitignored) — `.env.example` files are
  committed instead so nothing sensitive ships in the repo.

This is an application-layer security baseline. Once you add the DevOps
layer, this is also where SonarQube (static analysis) and Trivy (dependency /
image scanning) plug in against `backend/` and `frontend/`.

## 7. What's intentionally not included yet

By design, so you build (and can speak to) this layer yourself:

- Dockerfiles for both services
- Kubernetes manifests (Deployment, Service, Ingress) for EKS
- Terraform for the AWS infrastructure
- Jenkins pipeline (SonarQube → Trivy → build → push → deploy)
- ArgoCD GitOps manifests
- Prometheus/Grafana monitoring config

The FastAPI backend already exposes a `/healthz` liveness endpoint, ready for
a Kubernetes readiness/liveness probe when you get there.

## 8. Future enhancements

- Real payment gateway integration (Stripe) in place of the simulated checkout
- Redis-backed caching for product listings and session data
- Async order confirmation emails
- Full-text/vector search for the AI recommendation engine instead of keyword matching
- WebSocket-based live order status updates

## 9. Docs

- `docs/ARCHITECTURE.md` — deeper system design notes
- `docs/INTERVIEW_PREP.md` — likely interview questions this project prepares you for, organized by area
