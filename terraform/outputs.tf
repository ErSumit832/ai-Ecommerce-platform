output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64-encoded certificate data for the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "configure_kubectl" {
  description = "Command to configure your local kubeconfig for this cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "ECR repository URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "jenkins_ci_access_key_id" {
  description = "Access key ID for the Jenkins CI IAM user — store in Jenkins credentials, do not commit"
  value       = aws_iam_access_key.jenkins_ci.id
}

output "jenkins_ci_secret_access_key" {
  description = "Secret access key for the Jenkins CI IAM user — store in Jenkins credentials, do not commit"
  value       = aws_iam_access_key.jenkins_ci.secret
  sensitive   = true
}

output "backend_app_irsa_role_arn" {
  description = "IAM role ARN to annotate the backend ServiceAccount with for IRSA"
  value       = module.backend_app_irsa.iam_role_arn
}

output "alb_controller_irsa_role_arn" {
  description = "IAM role ARN to annotate the aws-load-balancer-controller ServiceAccount with"
  value       = module.aws_lb_controller_irsa.iam_role_arn
}
