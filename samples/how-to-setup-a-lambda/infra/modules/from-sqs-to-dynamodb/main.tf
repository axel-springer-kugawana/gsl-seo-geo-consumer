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
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      "${var.dynamodb_arn}"
    ]
  }
}

resource "aws_iam_policy" "lambda_iam_policy" {
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_iam_policy.arn
}

module "lambda_nonvpc" {
  source                   = "./constructs/lambda-nonvpc"
  lambda_function_name     = "sample-nonvpc"
  lambda_dist_dir          = "../src/dist/lambda-nonvpc/"
  lambda_handler           = "lambda-nonvpc.handler"
  env_variables            = []
  runtime                  = "nodejs18.x"
  memory_size              = 512
  lambda_timeout           = ""
  lambda_role_arn          = aws_iam_role.lambda_role.arn
  cloudwatch_log_retention = 3 # Log retention in days, avoid never expiring logs
}