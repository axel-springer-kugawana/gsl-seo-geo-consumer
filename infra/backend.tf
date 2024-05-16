terraform {
  backend "s3" {}
}

data "terraform_remote_state" "state" {
  backend = "s3"
}