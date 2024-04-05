terraform {
  backend "s3" {
    bucket  = "crazy-penguin-${var.environment}-tfstate"
    key     = "${var.environment}/classified-consumer/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}
