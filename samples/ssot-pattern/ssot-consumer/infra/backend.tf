terraform {
  backend "s3" {
    bucket  = "awesome-eagle-dev-tfstate"
    key     = "ssot_consumer/local/1.0.0/tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}