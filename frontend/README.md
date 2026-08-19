# Frontend — Circuitry (AI-Powered E-Commerce UI)

React 18 + Vite + Tailwind CSS. Talks to the FastAPI backend from Phase 1.

## Design direction

A storefront for engineers, styled like hardware documentation rather than a
generic template: charcoal surfaces, copper circuit-trace accents, and a teal
"signal" color reserved for AI/data moments. Display type is Space Grotesk,
body is IBM Plex Sans, and prices/specs/logs render in IBM Plex Mono — because
this audience reads spec sheets and terminals all day. The signature element
is the AI Shopping Assistant, styled as a literal terminal window with a
blinking cursor, docked bottom-right on every page.

## 1. Setup

```bash
cd frontend
npm install
cp .env.example .env      # point VITE_API_URL at your backend
npm run dev                # http://localhost:5173
```

Make sure the backend (Phase 1) is running first — the app calls it directly,
there's no mock data layer.

## 2. Build for production

```bash
npm run build       # outputs to dist/
npm run preview      # serve the production build locally on :3000
```

`dist/` is a static bundle — serve it from any static host or container.

## 3. Folder structure

```
frontend/
  src/
    api/            # axios client + grouped endpoint functions
    context/         # AuthContext (JWT session), CartContext
    components/      # Navbar, Footer, ProductCard, AIChatWidget, route guards
    pages/            # Home, ProductList, ProductDetail, Cart, Checkout,
                       # Login, Register, Orders, OrderDetail, Wishlist
    pages/admin/       # AdminDashboard, AdminProducts, AdminOrdersUsers
  index.html
  tailwind.config.js  # design tokens (colors, fonts) live here
```

## 4. Pages ↔ backend endpoints

| Page | Endpoints used |
|---|---|
| Home | `/products`, `/categories`, `/ai/recommend` |
| Product list | `/products` (search/filter/sort/paginate), `/categories` |
| Product detail | `/products/{id}`, `/products/{id}/reviews`, `/reviews/ai-summary`, `/cart`, `/wishlist` |
| Cart / Checkout | `/cart/*`, `/orders/checkout` |
| Orders | `/orders`, `/orders/{id}` |
| Wishlist | `/wishlist/*` |
| AI Chat widget (global) | `/ai/chat` |
| Admin dashboard | `/admin/dashboard`, `/ai/sales-analytics`, `/ai/incident-analysis` |
| Admin products | `/products` CRUD |
| Admin orders/users | `/orders/admin/*`, `/admin/users` |

## 5. Auth

JWT access + refresh tokens stored in `localStorage`. The axios client
auto-attaches the access token and transparently refreshes it on a 401 once,
via `/api/v1/auth/refresh` — see `src/api/client.js`.

## 6. Notes

- No `localStorage`/browser-storage restrictions apply here — this is a real
  Vite app running in its own browser context, not a claude.ai artifact.
- Demo admin login (after you run the backend's `seed_data.py`):
  `admin@ecommerce.local` / `Admin123!`
