locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  cluster_name = "${var.project_name}-${var.environment}-eks"
  azs          = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # /20 subnets carved out of the /16 VPC CIDR: private blocks first,
  # public blocks offset by 8 so they never collide.
  private_subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnet_cidrs  = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i + 8)]
}
