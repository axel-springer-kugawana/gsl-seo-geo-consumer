data "aws_ssm_parameter" "account_name" {
  name = "/aft/account-request/custom-fields/account_name"
}

data "aws_vpc" "default" {
  filter {
    name = "tag:Name"
    values = [
      data.aws_ssm_parameter.account_name.value
    ]
  }
}

data "aws_subnets" "application" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "tag:Labels"
    values = ["*application*"]
  }
}
