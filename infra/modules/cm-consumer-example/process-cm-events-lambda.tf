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
data "aws_secretsmanager_secret" "by-name" {
  name = "${var.application}-${var.environment}-${var.ssot_name}-postgres_writer-secret"
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
      aws_secretsmanager_secret.by-name.arn
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
    resources = [
      module.aurora_cluster.rds_cluster_writer_endpoint
    ]
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
    CM_API_SECRET_NAME = "${var.application}-${var.environment}-${var.ssot_name}-postgres_writer-secret"
  }
}
