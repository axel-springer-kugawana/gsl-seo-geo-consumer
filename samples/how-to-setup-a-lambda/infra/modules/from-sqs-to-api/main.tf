resource "aws_lambda_event_source_mapping" "lambda_event_source" {
  event_source_arn        = var.queue_arn
  function_name           = module.lambda_vpc.function_name
  function_response_types = ["ReportBatchItemFailures"]
  scaling_config {
    maximum_concurrency = var.process_ssot_events_lambda.queue_esm_max_concurrency
  }
}

resource "aws_iam_role" "lambda_role" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      "${var.queue_arn}"
    ]
  }
  statement {
    effect  = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "lambda_iam_policy" {
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_iam_policy.arn
}

module "lambda_vpc" {
  source                   = "./constructs/lambda-vpc"
  lambda_function_name     = "sample-vpc"
  lambda_dist_dir          = "../src/dist/lambda-vpc/"
  lambda_handler           = "lambda-vpc.handler"
  env_variables            = []
  runtime                  = "nodejs18.x"
  memory_size              = 512
  lambda_timeout           = ""
  lambda_role_arn          = ""
  cloudwatch_log_retention = 3              # Log retention in days, avoid never expiring logs
  vpc_id                   = var.vpc_id     # You may want to use the default VPC of the AWS account
  subnet_ids               = var.subnet_ids # Should be the "application" subnets
}