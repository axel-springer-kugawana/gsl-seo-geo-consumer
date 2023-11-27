terraform {
  required_version = ">= 1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.26.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      costCenter         = "aviv"
      domain             = "architecture"
      capability         = "Not Applicable"
      contact            = "aviv_architecture"
      application        = var.application
      environment        = var.environment
      team               = "architecture"
      managed            = "terraform"
      taggingVersion     = "1.2"
      dataClassification = "internal"
    }
  }
}
