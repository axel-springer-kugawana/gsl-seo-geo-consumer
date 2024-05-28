locals {
  pg_connector_fn_name           = "${var.application}-${var.environment}-athenapgconnector"
  spill_bucket_prefix            = "athena-spill"
  pgconnector_sar_application_id = "arn:aws:serverlessrepo:us-east-1:292517598671:applications/AthenaPostgreSQLConnector"
  db_name                        = var.db.name
  db_cluster_endpoint            = var.db.cluster_endpoint
  db_secret_name                 = var.db.secret_name
  db_security_group_id           = var.db.security_group_id
  region                         = data.aws_region.current.name
  account_id                     = data.aws_caller_identity.current.account_id
  vpc_id                         = data.aws_ssm_parameter.vpc_id.value
  application_subnet_ids         = join(",", data.aws_subnets.application_subnets.ids)
}

resource "random_string" "this" {
  length  = 6
  lower   = true
  upper   = false
  special = false
}

resource "aws_security_group" "this" {
  vpc_id = local.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
}

resource "aws_security_group_rule" "_" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = local.db_security_group_id
  source_security_group_id = aws_security_group.this.id
}

resource "aws_s3_bucket" "this" {
  bucket        = "${var.application}-${var.environment}-${random_string.this.id}"
  force_destroy = true
}

## https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/create/app?applicationId=arn:aws:serverlessrepo:us-east-1:292517598671:applications/AthenaPostgreSQLConnector
resource "aws_serverlessapplicationrepository_cloudformation_stack" "_" {
  name           = "${var.application}-${var.environment}-connector"
  application_id = local.pgconnector_sar_application_id
  capabilities = [
    "CAPABILITY_IAM",
    "CAPABILITY_RESOURCE_POLICY",
  ]
  parameters = {
    LambdaFunctionName      = local.pg_connector_fn_name
    DefaultConnectionString = "postgres://jdbc:postgresql://${local.db_cluster_endpoint}:5432/${local.db_name}?$${${local.db_secret_name}}"
    SecretNamePrefix        = local.db_secret_name
    SpillBucket             = aws_s3_bucket.this.bucket
    SpillPrefix             = local.spill_bucket_prefix
    SecurityGroupIds        = aws_security_group.this.id
    SubnetIds               = local.application_subnet_ids
  }

  tags = {
    ## Hack: this to avoid errors that could be returned by cloudformation when no updates 
    ## are to be performed on the resource.
    # TODO: Find a better way to handle this.
    updatedAt : timestamp()
  }
}

resource "aws_athena_data_catalog" "_" {
  name        = "${var.application}-${var.environment}-${local.db_name}-datasource"
  description = "Athena connector to the ${local.db_name}"
  type        = "LAMBDA"
  parameters = {
    "function" = "arn:aws:lambda:${local.region}:${local.account_id}:function:${local.pg_connector_fn_name}"
  }
}


