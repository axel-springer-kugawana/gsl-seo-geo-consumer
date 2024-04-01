terraform {
  backend "s3" {
    bucket  = "awesome-eagle-sandbox-tfstate"
    key     = "lambda-web-adapter/local/1.0.0/tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}
