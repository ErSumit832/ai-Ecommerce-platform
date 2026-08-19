# Terraform — EKS Cluster Provisioning

Provisions everything the Kubernetes manifests in `../kubernetes/` need to
run on AWS: a VPC, an EKS cluster with a managed node group, two ECR
repositories, and the IAM/IRSA roles the CI pipeline and in-cluster
workloads use.

## What this creates

| Resource | File | Notes |
|---|---|---|
| VPC (3 AZs, public + private subnets, NAT) | `vpc.tf` | via `terraform-aws-modules/vpc` |
| EKS cluster + managed node group | `eks.tf` | via `terraform-aws-modules/eks`, IRSA enabled |
| ECR repos (backend, frontend) | `ecr.tf` | scan-on-push, 10-image retention |
| Jenkins CI IAM user (ECR push + EKS describe only) | `iam.tf` | scoped to exactly those two things — see `jenkins/README.md` for why Jenkins doesn't get broader cluster access |
| IRSA role for AWS Load Balancer Controller | `iam.tf` | only needed if you route the Ingress through ALB instead of ingress-nginx |
| IRSA role for the backend app | `iam.tf` | read-only access to its own Secrets Manager secret |
| Secrets Manager secret (empty placeholder) | `secrets.tf` | you fill in the actual values out of band, see the file's header comment |

## 1. Prerequisites

- Terraform >= 1.7
- AWS CLI configured with credentials that can create VPCs/EKS/IAM
  (this is a broad, admin-ish permission set — a bootstrapping identity,
  not the Jenkins CI user this config creates)
- (Recommended) an S3 bucket + DynamoDB table for remote state — see the
  commented `backend "s3"` block in `versions.tf`. Bootstrap those two
  resources by hand or in a separate one-off Terraform config first, since
  a backend can't provision the bucket it depends on.

## 2. Apply

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars — region, sizing, etc.

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

This takes **15–20 minutes**, mostly waiting on the EKS control plane.

## 3. Connect kubectl

```bash
terraform output -raw configure_kubectl | bash
kubectl get nodes
```

## 4. Wire the output into Jenkins and Kubernetes

```bash
terraform output ecr_backend_repository_url
terraform output ecr_frontend_repository_url
terraform output -raw jenkins_ci_access_key_id
terraform output -raw jenkins_ci_secret_access_key   # store in Jenkins credentials, then discard
```

- Put the ECR repo URLs into `jenkins/Jenkinsfile`'s `ECR_REGISTRY` /
  `AWS_ACCOUNT_ID` values (or Jenkins credentials/params — see
  `jenkins/README.md`).
- Put the Jenkins CI access key into a Jenkins "AWS Credentials" credential
  — never commit it, and treat `terraform.tfstate` itself as sensitive
  since it contains this key in plaintext.
- Annotate the backend `ServiceAccount` with
  `terraform output -raw backend_app_irsa_role_arn` if/when you adopt IRSA
  for secret access instead of a plain Kubernetes Secret.

## 5. Cost notes

This is sized for a portfolio/demo cluster, not high-availability production:

- `single_nat_gateway = true` — one NAT gateway instead of one per AZ
  (cheaper, but a single point of failure for outbound traffic). Flip to
  `false` for real production.
- `t3.large` × 2 nodes is a reasonable floor for running the backend,
  frontend, and Postgres pods with some headroom — resize via
  `node_instance_types` / `node_desired_size` in `terraform.tfvars`.
- EKS control plane itself is a fixed ~$73/month regardless of node count.

**Remember to `terraform destroy` when you're done experimenting** — an
idle EKS cluster with a NAT gateway runs a real, ongoing bill.

## 6. Destroy

```bash
terraform destroy
```

Kubernetes resources (from `kubernetes/` or via ArgoCD) should generally be
torn down first if they created any AWS resources of their own (e.g. an ALB
via Ingress) — `terraform destroy` doesn't know about those, only about what
Terraform itself created.
