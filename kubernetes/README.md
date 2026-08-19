# Kubernetes Manifests

Plain manifests (no Helm/Kustomize) — numbered so `kubectl apply -f .` on the
whole folder applies them in a sane order.

## 1. Build and push images first

```bash
# Backend
cd backend
docker build -t <registry>/ecommerce-backend:v1.0.0 .
docker push <registry>/ecommerce-backend:v1.0.0

# Frontend — VITE_API_URL is baked in at build time, not runtime
cd ../frontend
docker build \
  --build-arg VITE_API_URL=https://app.yourdomain.com \
  -t <registry>/ecommerce-frontend:v1.0.0 .
docker push <registry>/ecommerce-frontend:v1.0.0
```

On EKS, `<registry>` is your ECR repo URI, e.g.
`123456789012.dkr.ecr.us-east-1.amazonaws.com/ecommerce-backend`.

## 2. Fill in placeholders before applying

- `10-backend-deployment.yaml` and `20-frontend-deployment.yaml`:
  replace `REPLACE_ME/...` with your actual image URIs and tags.
- `02-secret.example.yaml`: replace every `REPLACE_ME` — or better, don't
  apply this file at all and instead run the `kubectl create secret`
  command in its header comment (keeps real secrets out of git entirely).
- `30-ingress.yaml`: replace `app.yourdomain.com` with your real domain, and
  swap the `cert-manager.io/cluster-issuer` annotation / ingress class if
  you're not running cert-manager + ingress-nginx.
- `01-configmap.yaml`: update `CORS_ORIGINS` to match your real frontend
  domain, and set `AI_PROVIDER` to whichever provider you're using.

## 3. Apply

```bash
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl create secret generic ecommerce-secrets -n ecommerce-ai \
  --from-literal=SECRET_KEY='...' \
  --from-literal=POSTGRES_PASSWORD='...' \
  --from-literal=DATABASE_URL='postgresql://ecommerce_user:...@postgres:5432/ecommerce_db' \
  --from-literal=REDIS_URL='redis://redis:6379/0' \
  --from-literal=OPENAI_API_KEY='sk-...' \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-...'

# Dev/demo database only — see the warning at the top of 03-postgres.yaml.
# Skip this file entirely if DATABASE_URL already points at RDS.
kubectl apply -f 03-postgres.yaml

kubectl apply -f 10-backend-deployment.yaml
kubectl apply -f 11-backend-service.yaml
kubectl apply -f 12-backend-hpa.yaml
kubectl apply -f 20-frontend-deployment.yaml
kubectl apply -f 21-frontend-service.yaml
kubectl apply -f 30-ingress.yaml
```

Or simply `kubectl apply -f kubernetes/` once the secret exists and every
placeholder above is filled in — the numeric prefixes keep the apply order
correct either way.

## 4. Verify

```bash
kubectl -n ecommerce-ai get pods
kubectl -n ecommerce-ai get svc
kubectl -n ecommerce-ai logs deploy/backend
kubectl -n ecommerce-ai port-forward svc/backend-service 8000:80   # sanity check without the ingress
```

The backend's `/healthz` endpoint (already implemented in `app/main.py`) is
what both the container `HEALTHCHECK` and the Kubernetes readiness/liveness
probes call — no extra code needed on the app side.

## 5. What's deliberately not here

- **Seeding demo data**: run `python -m scripts.seed_data` (or apply
  `backend/scripts/seed_data.sql`) as a one-off `kubectl exec` into a backend
  pod, or as a Kubernetes `Job` — not included here since it's a one-time
  action, not a long-running workload.
- **Redis Deployment**: `REDIS_URL` is already read into backend config but
  unused by the app today (see `docs/ARCHITECTURE.md`) — add a Redis
  manifest when you actually wire in caching.
- **Terraform / EKS cluster provisioning / Jenkins / ArgoCD**: separate
  layers above this one, per the project's stated build-it-yourself scope.
