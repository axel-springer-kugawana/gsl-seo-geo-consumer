data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "archive_file" "zip_the_lambda_code" {
  type        = "zip"
  source_dir  = var.lambda_dist_dir
  output_path = "${path.module}/${var.lambda_function_name}.zip"
}

resource "aws_security_group" "lambda_vpc_sg" {
  name        = lower("${var.lambda_function_name}-vpc-sg")
  description = "${var.lambda_function_name} server access security group"
  vpc_id      = var.vpc_id
}

resource "aws_security_group_rule" "allow_https" {
  type              = "egress"
  description       = "HTTPS egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
  security_group_id = aws_security_group.lambda_vpc_sg.id
}

resource "aws_lambda_function" "lambda_function" {
  function_name    = var.lambda_function_name
  filename         = data.archive_file.zip_the_lambda_code.output_path
  role             = var.lambda_role_arn
  handler          = var.lambda_handler
  source_code_hash = filebase64sha256(data.archive_file.zip_the_lambda_code.output_path)
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = var.env_variables
  }

  vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = [aws_security_group.lambda_vpc_sg.id]
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.cloudwatch_log_retention
}

resource "aws_cloudwatch_log_subscription_filter" "datadog" {
  name            = "${var.lambda_function_name}_datadog_logfilter"
  role_arn        = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/datadog-kinesis-metrics"
  log_group_name  = aws_cloudwatch_log_group.lambda_log_group.name
  filter_pattern  = ""
  destination_arn = "arn:aws:firehose:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:deliverystream/DatadogCWLogsforwarder"
}