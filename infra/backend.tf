terraform {
  backend "s3" {}
}

data "terraform_remote_state" "state" {
  backend = "s3"
  config = {
    bucket  = "crazy-penguin-${environment}-tfstate"
    key     = "${environment}/classified-consumer/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}