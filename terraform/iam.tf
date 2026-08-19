# ============================================================================
# CI identity — used by Jenkins to push images to ECR and read cluster info.
# Deliberately scoped to exactly those two things; Jenkins never gets
# broad EKS/kubectl access directly (see argocd/README.md for why: it
# pushes a manifest change to git, ArgoCD does the actual deploying).
# ============================================================================
resource "aws_iam_user" "jenkins_ci" {
  name = "${var.project_name}-jenkins-ci"
  tags = local.tags
}

data "aws_iam_policy_document" "jenkins_ci" {
  statement {
    sid    = "ECRAuth"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ECRPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [
      aws_ecr_repository.backend.arn,
      aws_ecr_repository.frontend.arn,
    ]
  }

  statement {
    sid    = "EKSDescribe"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
    ]
    resources = [module.eks.cluster_arn]
  }
}

resource "aws_iam_user_policy" "jenkins_ci" {
  name   = "${var.project_name}-jenkins-ci-policy"
  user   = aws_iam_user.jenkins_ci.name
  policy = data.aws_iam_policy_document.jenkins_ci.json
}

# NOTE: this generates a real AWS access key pair into Terraform state.
# For a real environment, prefer having Jenkins run on an EC2 instance /
# EKS pod with an IAM instance profile or IRSA role instead of long-lived
# access keys — this resource exists to make `terraform apply` produce a
# working demo out of the box. If you keep it, treat the state file as a
# secret (it is one), and rotate this key immediately if the state file
# is ever exposed.
resource "aws_iam_access_key" "jenkins_ci" {
  user = aws_iam_user.jenkins_ci.name
}

# ============================================================================
# IRSA — IAM Roles for Service Accounts
# ============================================================================

# AWS Load Balancer Controller — required if you route the Ingress
# (kubernetes/30-ingress.yaml) through an ALB instead of ingress-nginx.
module "aws_lb_controller_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.44"

  role_name                              = "${var.project_name}-alb-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }

  tags = local.tags
}

# Backend app pods — scoped read-only access to the app's own secret in
# Secrets Manager (secrets.tf). This is the IRSA counterpart to the
# "External Secrets Operator" note in kubernetes/02-secret.example.yaml:
# once you wire that operator in, the backend's ServiceAccount assumes
# this role instead of the app reading a plain Kubernetes Secret.
module "backend_app_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.44"

  role_name = "${var.project_name}-backend-app"

  role_policy_arns = {
    secrets_read = aws_iam_policy.backend_secrets_read.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["ecommerce-ai:backend"]
    }
  }

  tags = local.tags
}

resource "aws_iam_policy" "backend_secrets_read" {
  name = "${var.project_name}-backend-secrets-read"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.app_secrets.arn]
    }]
  })
}
