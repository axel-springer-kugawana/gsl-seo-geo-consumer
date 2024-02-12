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

resource "aws_security_group" "lambda_vpc_sg" {
  count       = var.is_lambda_vpc ? 1 : 0
  name        = lower("${var.lambda_function_name}-vpc-sg")
  description = "${var.lambda_function_name} server access security group"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value
}

resource "aws_security_group_rule" "allow_https" {
  count             = var.is_lambda_vpc ? 1 : 0
  type              = "egress"
  description       = "HTTPS egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
  security_group_id = aws_security_group.lambda_vpc_sg[0].id
}

data "archive_file" "zip_the_lambda_code" {
  type        = "zip"
  source_file  = var.lambda_dist_file
  output_path = "${path.root}/.terraform/tmp/lambda-dist-zips/${var.lambda_function_name}.zip"
}

resource "aws_lambda_function" "lambda_function" {
  function_name    = var.lambda_function_name
  filename         = data.archive_file.zip_the_lambda_code.output_path
  role             = var.lambda_role_arn
  handler          = var.lambda_handler
  source_code_hash = filebase64sha256("${data.archive_file.zip_the_lambda_code.output_path}")
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.timeout

  environment {
    variables = var.env_variables
  }

    dynamic "vpc_config" {
    for_each = var.is_lambda_vpc ? [1] : []
    content {
      subnet_ids         = data.aws_subnets.application_subnets.ids
      security_group_ids = [aws_security_group.lambda_vpc_sg[0].id]
    }
  }

  layers = var.enable_secrets_manager_extension ? [
    "arn:aws:lambda:eu-west-1:015030872274:layer:AWS-Parameters-and-Secrets-Lambda-Extension:4"
  ] : []


}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.cloudwatch_log_retention
}
