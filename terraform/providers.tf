provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}

# Needed by the EKS module's aws-auth handling and by any Kubernetes-facing
# data sources; kept minimal here since kubectl/ArgoCD/Jenkins do the actual
# in-cluster work, not Terraform.
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}
