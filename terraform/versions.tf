terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  # ------------------------------------------------------------------------
  # Remote state — uncomment once the state bucket + lock table exist.
  # Bootstrap them once, by hand or in a separate tiny Terraform config,
  # since a backend can't provision the infrastructure it depends on.
  #
  # backend "s3" {
  #   bucket         = "ecommerce-ai-tfstate"
  #   key            = "eks/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "ecommerce-ai-tfstate-lock"
  #   encrypt        = true
  # }
  # ------------------------------------------------------------------------
}
