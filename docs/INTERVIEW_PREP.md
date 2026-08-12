# Interview Prep — Questions This Project Prepares You For

Organized by area. Each question is answerable by pointing at a specific,
real decision in this codebase — not a generic talking point.

## Backend / API design

- **"How did you structure your FastAPI app for maintainability?"**
  Routers per resource (`auth`, `products`, `cart`, `orders`, `reviews`,
  `ai`, `admin`), Pydantic schemas separated from ORM models, config
  centralized in `core/config.py` via `pydantic-settings`.
- **"How do you handle authentication/authorization?"**
  JWT access + refresh tokens; role checks enforced via FastAPI dependencies
  (`get_current_user`, `get_current_admin`) at the route layer, not just in
  the UI — walk through `backend/app/core/deps.py`.
- **"Why UUID strings instead of auto-increment integer IDs?"**
  Avoids leaking record counts/order volume externally, and matches
  distributed-system norms where IDs may be generated client-side or across
  services later.
- **"How would you scale the product listing endpoint?"**
  Point at `REDIS_URL` already being read into settings, unused — the
  intended first caching target — plus pagination already built into
  `GET /api/v1/products`.

## AI integration

- **"How do you handle an AI provider going down or returning garbage?"**
  Walk through `ai_service.py`: the `__AI_ERROR__` sentinel pattern, graceful
  fallback text/heuristics in every router that calls AI (`reviews.py`,
  `ai.py`), and why no AI failure should ever 500 a customer-facing request.
- **"How would you swap from OpenAI to Anthropic (or support both)?"**
  One `AI_PROVIDER` env var — the router code never imports either SDK
  directly, only `ai_service.generate_text/generate_json`.
- **"How do you get structured output from an LLM reliably?"**
  `generate_json()` uses JSON mode for OpenAI and strict-JSON system prompts
  for Anthropic, then strips markdown fences before parsing — and has a
  documented fallback for parse failures.

## Frontend

- **"How do you handle token refresh without disrupting the user?"**
  `frontend/src/api/client.js` — an axios response interceptor catches 401s,
  queues concurrent failed requests, refreshes once, then replays them.
- **"How did you approach the design system?"**
  Explain the copper/signal/ink token system in `tailwind.config.js` and why
  it was chosen deliberately for a hardware/engineering audience rather than
  a generic template palette.
- **"How is state shared across the app (cart, auth)?"**
  React Context (`AuthContext`, `CartContext`) rather than a heavier state
  library — a reasonable call at this app's size, with a note on when you'd
  reach for something like Zustand/Redux instead (many more shared entities,
  or complex derived state).

## System design / trade-offs

- **"What did you deliberately leave out of v1, and why?"**
  Real payment gateway, vector search, Redis caching, observability — all
  named explicitly in `docs/ARCHITECTURE.md` under "Known simplifications."
  Being able to name your own scope cuts well in an interview.
- **"How would you containerize and deploy this to Kubernetes?"**
  Both services read all config from env vars already (no code changes
  needed for ConfigMaps/Secrets), and `/healthz` is already implemented for
  liveness/readiness probes — this is the natural next section of this
  project for you to build and speak to directly.

## A note on how to use this section

Don't memorize these answers — the value of having built this yourself is
being able to go one layer deeper than the question on any of these topics.
Use this list to find the parts of the codebase worth re-reading before an
interview, not as a script.
