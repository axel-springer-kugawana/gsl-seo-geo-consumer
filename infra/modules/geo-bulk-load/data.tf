data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "account_name" {
  name = "/aft/account-request/custom-fields/account_name"
}

data "aws_ssm_parameter" "vpc_id" {
  name = "/network/vpc/${data.aws_ssm_parameter.account_name.value}/id"
}

# Same selection as the lambda construct: private subnets with egress, from
# which s3, secrets manager and the aurora cluster are all reachable.
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

# The cluster is not managed here: it is created outside of this repository and
# only looked up, so that the task can be pointed at its writer endpoint.
data "aws_rds_cluster" "ssot" {
  cluster_identifier = var.rds.cluster_identifier
}
