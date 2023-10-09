terraform {
  required_version = ">= 1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.6.2"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      costCenter     = "aviv"
      application    = var.application
      environment    = var.environment
      owner          = "architecture-backend-guild"
      managed        = "terraform"
      taggingVersion = "1.0.0"
    }
  }
}