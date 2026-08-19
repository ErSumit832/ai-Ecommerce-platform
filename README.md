# Circuitry — AI-Powered Cloud-Native E-Commerce Platform

A full-stack, cloud-native e-commerce platform for engineering/DevOps
hardware, with five AI features built on OpenAI and Anthropic, and a
complete GitOps delivery pipeline to AWS EKS.

**Application** (React + FastAPI + PostgreSQL + AI) → **containerized**
(multi-stage Docker) → **provisioned** (Terraform/EKS) → **built & scanned**
(Jenkins + SonarQube + Trivy) → **deployed** (ArgoCD GitOps) → running on
Kubernetes.

---

## For interviewers: how to read this repo

Each top-level folder is a self-contained layer with its own README. If
you're reviewing this project, the fastest path is:

1. **This file** — end-to-end architecture and the request/deploy flow
2. `docs/ARCHITECTURE.md` — deeper system design notes and named trade-offs
3. `docs/INTERVIEW_PREP.md` — the questions this project is built to answer, organized by area
4. Then whichever layer you want to go deeper on — each folder README below covers setup, design decisions, and what's deliberately left out

| Layer | Folder | What's in it |
|---|---|---|
| Application | `backend/`, `frontend/` | FastAPI + React source, own READMEs |
| Containers | `backend/Dockerfile`, `frontend/Dockerfile` | Multi-stage builds |
| Orchestration | `kubernetes/` | Deployments, Services, Ingress, HPA |
| Infrastructure | `terraform/` | VPC, EKS, ECR, IAM/IRSA |
| CI | `jenkins/` | `Jenkinsfile` + setup guide |
| CD (GitOps) | `argocd/` | Application/AppProject manifests |
| Docs | `docs/` | Architecture notes, interview prep |
| Data | `backend/scripts/seed_data.py`, `.sql` | 25 demo products across 6 categories |

## 1. Project overview

**Circuitry** sells laptops, monitors, and infrastructure gear aimed at
engineers. Beyond a standard storefront (catalog, cart, checkout, order
tracking, reviews, admin dashboard), it layers AI throughout the shopping
and operations experience:

| Feature | What it does | Where |
|---|---|---|
| AI Product Recommendation | "I need a laptop for DevOps" → matched products + explanation | Home page hero |
| AI Shopping Assistant | Conversational chat, terminal-styled widget on every page | Global widget |
| AI Review Summarizer | Summarizes a product's reviews into a summary + pros/cons | Product detail page |
| AI Sales Analytics | Revenue/order trends + a plain-English AI insight | Admin dashboard |
| AI Incident Assistant | Paste a stack trace → root cause, severity, suggested fixes | Admin dashboard |

## 2. Application architecture

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

See `docs/ARCHITECTURE.md` for the fuller breakdown, including the data
model, auth model, and the AI provider abstraction.

## 3. CI/CD & GitOps flow (the whole pipeline, end to end)

```
 developer            Jenkins                                    ArgoCD            EKS
 ─────────    ┌──────────────────────────────────────────┐    ──────────    ──────────
 git push  →  │ Checkout                                   │
              │ SonarQube static analysis  (backend +       │
              │   frontend, parallel)                        │
              │ Quality Gate  (abort on red)                  │
              │ Trivy — filesystem scan  (dependencies)        │
              │ Docker build  (multi-stage, both services)      │
              │ Trivy — image scan  (HIGH/CRITICAL = fail)       │
              │ Push images → ECR                                │
              │ Bump image tag in kubernetes/*.yaml,              │
              │   commit, push  ─────────────────────────────────┼──→ notices diff
              └──────────────────────────────────────────┘         (poll or webhook)
                                                                        │
                                                              automated sync, prune,
                                                              self-heal against drift
                                                                        ▼
                                                                  kubectl apply
                                                                  equivalent, in-cluster
                                                                        ▼
                                                                  rolling update,
                                                                  readiness/liveness
                                                                  probes gate traffic
```

**The key design decision, worth being able to explain:** Jenkins' AWS
identity (`terraform/iam.tf`) can push to ECR and describe the cluster —
nothing more. It has no `kubectl` access at all. The only path from "image
built" to "running in the cluster" is Jenkins pushing a manifest change to
git, and ArgoCD — which does hold cluster-apply permissions — reconciling
that diff. Every deployment is therefore a git commit (audit trail, easy
rollback via `git revert`), and a compromised CI credential can't directly
mutate the running cluster.

Full detail: `jenkins/README.md` (pipeline stages, credentials, plugins)
and `argocd/README.md` (Application structure, sync policy, image-updater
alternative).

## 4. Repo structure

```
ecommerce-ai/
  backend/          # FastAPI + PostgreSQL + AI service layer
    Dockerfile        # multi-stage: venv builder → slim runtime, non-root
    scripts/            # seed_data.py, seed_data.sql — 25 demo products
  frontend/          # React + Vite + Tailwind
    Dockerfile        # multi-stage: node builder → nginx-unprivileged
    nginx.conf          # SPA routing + asset caching
  kubernetes/        # plain manifests — Deployments, Services, Ingress, HPA
  terraform/          # VPC, EKS, ECR, IAM/IRSA — provisions the cluster
  jenkins/             # Jenkinsfile — build, scan, push, update manifests
  argocd/               # AppProject + 3 Applications (platform/backend/frontend)
  docs/                  # Architecture notes, interview prep
```

## 5. Quick start — application only (no cloud, no cluster)

You need Python 3.11+, Node 18+, and a PostgreSQL instance. This is the
fastest way to run and demo the app itself.

```bash
# 1. Database
docker run --name ecommerce-postgres -e POSTGRES_USER=ecommerce_user \
  -e POSTGRES_PASSWORD=ecommerce_pass -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 -d postgres:16

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # add your OPENAI_API_KEY or ANTHROPIC_API_KEY
python -m scripts.seed_data       # demo products + admin login
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                        # http://localhost:5173
```

Demo admin login: `admin@ecommerce.local` / `Admin123!`

## 6. Full path to production — application → AWS

```bash
# 1. Provision AWS infrastructure (~15–20 min)
cd terraform
cp terraform.tfvars.example terraform.tfvars    # edit as needed
terraform init && terraform apply
terraform output -raw configure_kubectl | bash   # connect kubectl

# 2. Bootstrap the cluster
kubectl apply -f argocd/project.yaml   # after installing ArgoCD — see argocd/README.md
kubectl apply -f argocd/platform-application.yaml
kubectl apply -f argocd/backend-application.yaml
kubectl apply -f argocd/frontend-application.yaml

# 3. Configure Jenkins (see jenkins/README.md) with the Terraform outputs:
#    - ECR repo URLs, Jenkins CI IAM credentials
#    - SonarQube server, GitHub webhook

# 4. Push to main → Jenkins builds, scans, pushes, updates manifests →
#    ArgoCD syncs → app is live on EKS
```

Each step above has a dedicated README with the full detail:
`terraform/README.md`, `argocd/README.md`, `jenkins/README.md`,
`kubernetes/README.md`.

## 7. AI features setup

Both AI providers are supported behind one switch in `backend/.env` (or the
`AI_PROVIDER` key in `kubernetes/01-configmap.yaml` when running on
Kubernetes):

```
AI_PROVIDER=openai            # or "anthropic"
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key configured, every AI endpoint still responds (no crashes) with
a graceful fallback — useful for demoing the rest of the app without a live
key, or for showing the degrade-gracefully design choice explicitly.

## 8. Security notes (as shipped)

- Passwords hashed with bcrypt via `passlib`.
- JWT access + refresh tokens; access tokens are short-lived, refresh flow is
  automatic in the frontend axios client.
- Role-based access control (`customer` / `admin`) enforced at the FastAPI
  dependency layer, not just in the UI.
- CORS is explicitly configured (`CORS_ORIGINS`) rather than left wide open.
- Secrets live in `.env` files locally (gitignored) or Kubernetes Secrets /
  AWS Secrets Manager in the cluster — never committed; `.env.example` /
  `kubernetes/02-secret.example.yaml` are templates only.
- SonarQube (static analysis) and Trivy (dependency + image vulnerability
  scanning) run in the Jenkins pipeline on every build — see `jenkins/README.md`.
- Both Docker images run as non-root; Kubernetes Deployments set
  `allowPrivilegeEscalation: false` and drop all capabilities.
- IAM is scoped per-purpose (Jenkins CI, ALB controller, backend app) via
  IRSA rather than one broad cluster-admin role — see `terraform/iam.tf`.

## 9. What's still open (honest scope)

- **Prometheus/Grafana** — not yet wired in. The backend's `/healthz`
  endpoint and the design notes in `docs/ARCHITECTURE.md` point to where
  metrics/dashboards would plug in (`prometheus-fastapi-instrumentator` for
  a `/metrics` endpoint, then a ServiceMonitor + Grafana dashboard).
- **Real payment gateway** — checkout is simulated (see `docs/ARCHITECTURE.md`,
  "Known simplifications").
- **Redis caching** — `REDIS_URL` is wired into config, unused today.
- Full list of intentional v1 simplifications: `docs/ARCHITECTURE.md`.

## 10. Docs

- `docs/ARCHITECTURE.md` — deeper system design notes, data model, auth
  model, and named trade-offs
- `docs/INTERVIEW_PREP.md` — likely interview questions this project
  prepares you for, organized by area (backend, AI integration, frontend,
  system design)
