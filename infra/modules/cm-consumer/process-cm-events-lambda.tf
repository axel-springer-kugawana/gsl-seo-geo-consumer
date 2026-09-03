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

resource "aws_iam_policy" "iam_policy_for_lambda" {
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.iam_policy_for_lambda.arn
}

module "process_cm_connector_events_lambda" {
  source                           = "../constructs/lambda"
  lambda_handler                   = var.process_cm_connector_events_lambda.handler
  lambda_function_name             = "${var.application}-${var.environment}-process-gm-connector-events"
  lambda_dist_file                 = var.process_cm_connector_events_lambda.dist_file
  lambda_role_arn                  = aws_iam_role.lambda_role.arn
  memory_size                      = "512"
  timeout                          = 9
  is_lambda_vpc                    = true
  enable_secrets_manager_extension = true
  env_variables = {
    MV_FEATURE_TABLE_NAME       = var.feature_dynamodb_table_name
    MV_LINEAGE_TABLE_NAME       = var.lineage_dynamodb_table_name
    MV_APPLICATION_NAME         = var.application
    GEO_DYNAMODB_SCHEMA_VERSION = var.geo_dynamodb_schema_version
  }
}

resource "aws_security_group_rule" "allow_postgre" {
  type              = "egress"
  description       = "Postgre TCP egress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
  security_group_id = module.process_cm_connector_events_lambda.sg_id
}

resource "aws_secretsmanager_secret" "lambda_consumer_credentials" {
  name                    = "${var.application}-lambda_consumer_credentials"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "postgres_consumer_version" {
  secret_id = aws_secretsmanager_secret.lambda_consumer_credentials.id
  secret_string = jsonencode({
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
      aws_secretsmanager_secret.lambda_consumer_credentials.arn,
      "arn:aws:secretsmanager:*:*:secret:cm-consumer-lambda_consumer_credentials*"
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
      "dynamodb:UpdateItem"
    ]
    resources = [
      var.feature_dynamodb_arn,
      var.lineage_dynamodb_arn
    ]
  }
}
