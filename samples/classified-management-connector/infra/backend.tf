terraform {
  backend "s3" {
    bucket  = "awesome-eagle-dev-tfstate"
    key     = "cm_connector_sample/local/1.0.0/tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}