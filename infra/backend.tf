terraform {
  backend "s3" {
    bucket  = "crazy-penguin-dev-tfstate"
    key     = "dev/classified-consumer/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}
