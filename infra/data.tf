data "aws_default_tags" "default_tags" {}

data "aws_vpc" "foundation_vpc" {
  filter {
    name   = "tag:Name"
    values = ["${var.aws_account_name}"]
  }
}

data "aws_subnets" "foundation_data_subnets" {
  filter {
    name   = "tag:Name"
    values = ["${var.aws_account_name}-data*"]
  }
}

data "aws_ec2_managed_prefix_list" "env_cidr" {
  name = "internal.aviv.aws.vpc.${var.aws_account_name}"
}