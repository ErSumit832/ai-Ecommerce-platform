# ArgoCD — GitOps Deployment

ArgoCD is the only thing with permission to change what's actually running
in the cluster. Jenkins builds and pushes images, then pushes a manifest
change to this same git repo — ArgoCD, running in-cluster and watching that
repo, picks up the diff and applies it. See `jenkins/README.md` §7 for the
reasoning behind that split.

## 1. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl -n argocd get pods -w   # wait for everything to be Running
```

## 2. Access the UI/CLI

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
# https://localhost:8080 — username "admin"

kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Change this password immediately after first login, and delete
`argocd-initial-admin-secret` once you have.

## 3. Update the repo URL, then apply

Every file in this folder has `repoURL: https://github.com/YOUR_ORG/ecommerce-ai.git`
as a placeholder — update it to your actual repo (all four files) before
applying:

```bash
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/platform-application.yaml
kubectl apply -f argocd/backend-application.yaml
kubectl apply -f argocd/frontend-application.yaml
```

## 4. Why three Applications instead of one

- `ecommerce-platform` — namespace, config, the dev/demo Postgres, and the
  Ingress. Changes rarely; Jenkins never touches these files.
- `ecommerce-backend` / `ecommerce-frontend` — scoped to exactly the two
  files each service's Jenkins stage edits (`10-backend-deployment.yaml`,
  `20-frontend-deployment.yaml`, plus their Services/HPA).

Splitting it this way means a backend release's sync history, health
status, and rollback are independent of the frontend's — closer to how
you'd actually want to reason about two independently-deployable services,
and a more realistic setup to discuss in an interview than one monolithic
Application.

## 5. Sync policy: automated + self-heal

All three Applications set:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

- **`prune: true`** — if a resource is removed from git, ArgoCD deletes it
  from the cluster too (not just additive).
- **`selfHeal: true`** — if someone runs `kubectl edit` directly against the
  cluster, ArgoCD reverts it back to match git on the next reconcile. Git is
  the single source of truth; manual cluster edits are treated as drift, not
  as a valid state.

## 6. Faster sync (optional)

By default ArgoCD polls git every ~3 minutes. For near-instant syncs after a
Jenkins push, add a GitHub webhook to
`<argocd-server>/api/webhook` (Settings → Webhooks in GitHub, content type
`application/json`) instead of waiting on the poll interval.

## 7. Verify a deployment

```bash
kubectl -n argocd get applications
argocd app get ecommerce-backend      # requires the argocd CLI + login
argocd app sync ecommerce-backend     # manual sync, if automated sync is off
```

## 8. A natural next step: Argo CD Image Updater

Today, Jenkins edits the manifest's `image:` line directly via `sed` and
pushes the commit (see `jenkins/Jenkinsfile`, "Update GitOps Manifests"
stage). [Argo CD Image Updater](https://argocd-image-updater.readthedocs.io/)
is an alternative that watches the ECR repo itself and updates the manifest
automatically on new pushes — removing the need for Jenkins to have git
write access at all. Worth naming as a "here's what I'd improve next" in an
interview.
