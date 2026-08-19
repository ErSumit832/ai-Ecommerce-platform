# Jenkins — CI Pipeline

Implements: **GitHub → Jenkins → SonarQube → Trivy → Docker Build → ECR →
(git push) → ArgoCD → EKS**.

Jenkins builds, scans, and pushes images — then hands off to ArgoCD by
pushing an image-tag change to this repo. It never calls `kubectl` or holds
cluster-admin credentials; see "Why Jenkins doesn't touch the cluster
directly" below.

## 1. Required Jenkins plugins

- Pipeline / Pipeline: AWS Steps
- SonarQube Scanner for Jenkins
- Docker Pipeline
- Git / SSH Agent
- AnsiColor (for readable pipeline logs)
- Credentials Binding

## 2. Agent requirements

The `docker-agent` label in the `Jenkinsfile` needs, at minimum:

- Docker (with the Jenkins user able to run `docker build`/`docker push`)
- AWS CLI v2
- [Trivy](https://aquasecurity.github.io/trivy/) CLI
- `sonar-scanner` CLI
- `git` + SSH client

The simplest setup is a Jenkins agent that is itself a Docker container/EC2
instance with those tools pre-installed — a dedicated `Dockerfile` for the
agent image is a reasonable next step once this pipeline is running.

## 3. Credentials to configure (Manage Jenkins → Credentials)

| Credential ID | Type | Used for |
|---|---|---|
| `aws-account-id` | Secret text | Building the ECR registry URL |
| `jenkins-ecr-credentials` | AWS Credentials | `docker push` to ECR — use the `jenkins_ci_access_key_id` / `jenkins_ci_secret_access_key` Terraform outputs |
| `jenkins-git-ssh-key` | SSH private key | Pushing the image-tag bump commit back to this repo |

## 4. SonarQube server

Configure under **Manage Jenkins → System → SonarQube servers**, name it
`SonarQubeServer` (matches `withSonarQubeEnv('SonarQubeServer')` in the
Jenkinsfile), and add a SonarQube token credential there.

You'll also want a **webhook** from SonarQube back to Jenkins
(`<jenkins-url>/sonarqube-webhook/`) so `waitForQualityGate` doesn't have to
poll — without it, the Quality Gate stage will hang until it times out.

## 5. GitHub webhook

Repo Settings → Webhooks → add `<jenkins-url>/github-webhook/`, content
type `application/json`, event: `push`. Then enable "GitHub hook trigger
for GITScm polling" on the Jenkins job.

## 6. Pipeline stages, in order

1. **Checkout** — pulls the triggering commit
2. **Static Analysis (SonarQube)** — backend and frontend scanned in parallel
3. **Quality Gate** — pipeline aborts if SonarQube's gate is red (override
   via the `SKIP_QUALITY_GATE` build parameter for emergencies only)
4. **Dependency Scan (Trivy, filesystem)** — scans `requirements.txt` /
   `package.json` for known-vulnerable dependencies before any image is
   even built
5. **Docker Build** — multistage builds for both `backend/Dockerfile` and
   `frontend/Dockerfile`, tagged `<git-sha>-<build-number>` and `latest`
6. **Image Scan (Trivy, container)** — scans the built images themselves;
   fails the build on HIGH/CRITICAL fixable vulnerabilities
7. **Push to ECR**
8. **Update GitOps Manifests** — bumps the `image:` line in
   `kubernetes/10-backend-deployment.yaml` and
   `kubernetes/20-frontend-deployment.yaml`, commits, and pushes

## 7. Why Jenkins doesn't touch the cluster directly

This is the GitOps split, and it's worth being able to explain in an
interview: Jenkins' IAM identity (`terraform/iam.tf` → `jenkins_ci`) is
scoped to exactly ECR push + `eks:DescribeCluster` — it has **no**
`kubectl`-equivalent permissions. The only way a new image reaches the
cluster is by ArgoCD (running in-cluster, watching this repo) noticing the
manifest diff and syncing it. That means:

- A compromised Jenkins credential can push a bad image tag to git, but
  can't directly mutate the running cluster, delete resources, or bypass
  ArgoCD's sync policies.
- Every deployment has a git commit as an audit trail, not just a Jenkins
  build log.
- Rolling back is `git revert` on the manifest, not a manual `kubectl`
  command run by whoever's on call.

## 8. Local dry run (without a Jenkins server)

You can exercise most of the pipeline's actual work by hand:

```bash
# Static analysis
cd backend && sonar-scanner -Dsonar.projectKey=ecommerce-ai-backend -Dsonar.sources=app

# Dependency scan
trivy fs --severity HIGH,CRITICAL backend/requirements.txt

# Build + scan
docker build -t ecommerce-ai-backend:local backend
trivy image --severity HIGH,CRITICAL ecommerce-ai-backend:local
```
