resource "aws_lambda_event_source_mapping" "lambda_event_source" {
  event_source_arn        = var.cm_connector_consumer_queue.arn
  function_name           = module.process_cm_connector_events_lambda.function_name
  function_response_types = ["ReportBatchItemFailures"]
  scaling_config {
    maximum_concurrency = var.process_cm_connector_events_lambda.queue_esm_max_concurrency
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
      "${var.cm_connector_consumer_queue.arn}"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      var.aws_secretsmanager_secret_arn
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds-db:connect"
    ]
    resources = [var.rds_arn]
  }
}

resource "aws_iam_policy" "iam_policy_for_lambda" {
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.iam_policy_for_lambda.arn
}

module "process_cm_connector_events_lambda" {
  source               = "../constructs/lambda"
  lambda_handler       = var.process_cm_connector_events_lambda.handler
  lambda_function_name = "${var.application}-${var.environment}-process-cm-connector-events"
  lambda_dist_file     = var.process_cm_connector_events_lambda.dist_file
  lambda_role_arn      = aws_iam_role.lambda_role.arn
  memory_size          = "512"
  timeout              = 29

  env_variables = {
    MV_TABLE_NAME      = aws_dynamodb_table.consumer_materialized_view_table.name
    CM_API_SECRET_NAME = module.rds.secret_name
  }
}
