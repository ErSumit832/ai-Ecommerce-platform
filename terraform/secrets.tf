# A single JSON secret holding everything backend/app/core/config.py reads
# from the environment. Left empty here (Terraform shouldn't own secret
# values) — fill it in once, out of band, via the AWS CLI or console:
#
#   aws secretsmanager put-secret-value \
#     --secret-id ecommerce-ai-app-secrets \
#     --secret-string '{
#       "SECRET_KEY": "...",
#       "DATABASE_URL": "postgresql://...",
#       "REDIS_URL": "redis://...",
#       "OPENAI_API_KEY": "sk-...",
#       "ANTHROPIC_API_KEY": "sk-ant-..."
#     }'
#
# Then either read it into the Kubernetes Secret via External Secrets
# Operator, or have the backend read it directly at startup via IRSA
# (module.backend_app_irsa in iam.tf) — either is a reasonable next step
# beyond the plain kubernetes/02-secret.example.yaml used today.
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}-app-secrets"
  description             = "Runtime secrets for the Circuitry backend (DB, JWT signing key, AI provider keys)"
  recovery_window_in_days = 7

  tags = local.tags
}
