data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "account_name" {
  name = "/aft/account-request/custom-fields/account_name"
}


data "aws_ssm_parameter" "vpc_id" {
  name = "/network/vpc/${data.aws_ssm_parameter.account_name.value}/id"
}


data "aws_ssm_parameter" "container_subnet_1" {
  name = "/network/subnet/${data.aws_ssm_parameter.account_name.value}-container-1/id"
}

data "aws_ssm_parameter" "container_subnet_2" {
  name = "/network/subnet/${data.aws_ssm_parameter.account_name.value}-container-2/id"
}

data "aws_ssm_parameter" "container_subnet_3" {
  name = "/network/subnet/${data.aws_ssm_parameter.account_name.value}-container-3/id"
}
