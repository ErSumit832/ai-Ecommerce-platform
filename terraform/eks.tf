# Using terraform-aws-modules/eks — same reasoning as the VPC module: EKS's
# control plane, node groups, and OIDC/IRSA wiring have a lot of moving
# parts that are easy to get subtly wrong by hand.
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name    = local.cluster_name
  cluster_version = var.cluster_version

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  # Public access is convenient for a portfolio/demo cluster reachable from
  # your laptop. In real production, set this false and connect over a
  # VPN / bastion / AWS SSM instead.
  cluster_endpoint_public_access = true

  # Enables the OIDC provider the IAM roles in iam.tf attach to (IRSA —
  # IAM Roles for Service Accounts), so pods get scoped AWS permissions
  # instead of broad node-level IAM roles.
  enable_irsa = true

  eks_managed_node_groups = {
    default = {
      instance_types = var.node_instance_types
      capacity_type  = "ON_DEMAND"
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_desired_size

      labels = {
        role = "app"
      }
    }
  }

  # Lets the Jenkins/CI IAM principal (and your own) manage the cluster via
  # kubectl/ArgoCD without needing to be the cluster creator.
  enable_cluster_creator_admin_permissions = true

  tags = local.tags
}
