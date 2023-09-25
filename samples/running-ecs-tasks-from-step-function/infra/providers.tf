terraform {
  required_version = ">= 1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.29.0"
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
      owner          = "architecture"
      managed        = "terraform"
      taggingVersion = "1.0.0"
    }
  }
}