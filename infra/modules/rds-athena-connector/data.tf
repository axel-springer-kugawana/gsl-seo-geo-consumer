data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "account_name" {
  name = "/aft/account-request/custom-fields/account_name"
}

data "aws_ssm_parameter" "vpc_id" {
  name = "/network/vpc/${data.aws_ssm_parameter.account_name.value}/id"
}

data "aws_subnets" "application_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_ssm_parameter.vpc_id.value]
  }
  filter {
    name   = "tag:Labels"
    values = ["*application*"]
  }
}
