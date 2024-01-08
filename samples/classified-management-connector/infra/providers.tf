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
      costCenter         = var.costCenter
      domain             = var.domain
      capability         = var.capability
      contact            = var.contact
      application        = var.application
      environment        = var.environment
      team               = var.team
      managed            = "terraform"
      taggingVersion     = var.taggingVersion
      dataClassification = var.dataClassification
      awsApplication     = "${var.application}-${var.environment}"
    }
  }
}
