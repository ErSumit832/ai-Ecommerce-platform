# Architecture Notes

## Request flow

1. Browser loads the React SPA (served by Vite in dev, or a static build in prod).
2. The SPA calls the FastAPI backend directly over REST — `frontend/src/api/client.js`
   attaches the JWT access token to every request and transparently refreshes
   it on a 401 via `/api/v1/auth/refresh`.
3. FastAPI routers (`backend/app/routers/`) handle the request, using
   SQLAlchemy sessions (`backend/app/db/database.py`) scoped per-request via
   FastAPI's dependency injection (`Depends(get_db)`).
4. AI-feature endpoints (`backend/app/routers/ai.py`, `reviews.py`) call
   `backend/app/services/ai_service.py`, which abstracts over OpenAI and
   Anthropic behind one `generate_text` / `generate_json` interface, selected
   by the `AI_PROVIDER` environment variable.

## Why a single AI service abstraction

Routers never import `openai` or `anthropic` directly — they call
`ai_service.generate_text(...)` or `generate_json(...)`. This means:

- Swapping providers is a one-line env change, not a router rewrite.
- Every AI call has one place that handles failures (`__AI_ERROR__` sentinel)
  so a flaky AI provider never 500s a customer-facing endpoint — it degrades
  to a clear fallback message instead.
- JSON-mode parsing (for review summaries and incident analysis) is handled
  once, including stripping accidental markdown fences.

## Data model

Core entities (`backend/app/db/models.py`):

- `User` (role: customer/admin) → `CartItem`, `WishlistItem`, `Order`, `Review`
- `Product` → belongs to `Category`, has many `Review`
- `Order` → has many `OrderItem` (price/name snapshotted at purchase time,
  so later product edits don't rewrite order history)
- `AIChatLog` — every shopping-assistant message is persisted per session,
  which is what the AI Incident Assistant and future analytics could mine

## Auth model

- Passwords: bcrypt via `passlib`.
- Tokens: JWT access token (short-lived) + refresh token (longer-lived),
  both signed with `SECRET_KEY`/`ALGORITHM` from settings.
- Authorization: FastAPI dependencies (`get_current_user`, `get_current_admin`
  in `backend/app/core/deps.py`) enforce role checks at the route level —
  the frontend's `RequireAuth`/`RequireAdmin` route guards are a UX
  convenience, not the security boundary.

## Where the DevOps layer plugs in (for your build-out)

| Concern | Plugs into |
|---|---|
| Containerization | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage: build → nginx/static serve) |
| Health checks | `GET /healthz` (backend) already implemented for K8s liveness/readiness probes |
| Config | Both services already read all config from environment variables (`.env.example` in each) — no code changes needed to inject config via K8s ConfigMaps/Secrets |
| Static analysis | SonarQube against `backend/app` (Python) and `frontend/src` (JS/JSX) |
| Vulnerability scanning | Trivy against built images and `requirements.txt` / `package.json` |
| Caching | `REDIS_URL` is already read into backend settings, unused today — a natural first place to add caching for `GET /api/v1/products` |
| Observability | Add `prometheus-fastapi-instrumentator` to expose `/metrics`; Grafana dashboards can chart request latency per route, AI call latency/error rate (already logged via `AIChatLog` and the `__AI_ERROR__` sentinel pattern), and order volume |

## Known simplifications (worth naming in an interview)

- Checkout assumes payment succeeds — there's no real payment gateway. The
  `Order` status flow (`pending → paid → processing → shipped → delivered`)
  is designed so a real gateway integration only needs to change the status
  set on the order at checkout time, nothing structural.
- Product search is keyword/`ILIKE`-based, not vector/semantic search — a
  documented "future enhancement," and a good example of scoping a v1
  deliberately rather than over-building.
- Redis is wired into config but not yet used — intentionally left as the
  first caching exercise once you've containerized the stack.
