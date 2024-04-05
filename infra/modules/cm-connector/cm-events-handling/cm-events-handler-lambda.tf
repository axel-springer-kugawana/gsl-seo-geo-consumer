resource "aws_lambda_event_source_mapping" "cm_events_lambda_event_source" {
  event_source_arn        = module.cm_events_consumer_queue.queue_arn
  function_name           = module.handle_cm_events_lambda.function_name
  function_response_types = ["ReportBatchItemFailures"]
  scaling_config {
    maximum_concurrency = var.handle_cm_events_lambda.queue_esm_max_concurrency
  }
}

resource "aws_iam_role" "handle_cm_events_lambda_role" {
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

data "aws_iam_policy_document" "handle_cm_events_lambda_policy" {
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
      "sqs:SendMessage",
    ]
    resources = [
      "${var.connector_events_queue.arn}"
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
      "${module.cm_events_consumer_queue.queue_arn}"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      "${aws_secretsmanager_secret.cm-api-secret.arn}"
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
}

resource "aws_iam_policy" "iam_policy_for_cm_events_handler_lambda" {
  policy = data.aws_iam_policy_document.handle_cm_events_lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role_cm_events_handler" {
  role       = aws_iam_role.handle_cm_events_lambda_role.name
  policy_arn = aws_iam_policy.iam_policy_for_cm_events_handler_lambda.arn
}

module "handle_cm_events_lambda" {
  source                           = "../../constructs/lambda"
  lambda_handler                   = var.handle_cm_events_lambda.handler
  lambda_function_name             = "${var.application}-${var.environment}-${var.ssot_name}-events-handler"
  lambda_dist_file                 = var.handle_cm_events_lambda.dist_file
  lambda_role_arn                  = aws_iam_role.handle_cm_events_lambda_role.arn
  memory_size                      = "512"
  timeout                          = 25
  is_lambda_vpc                    = true
  enable_secrets_manager_extension = true
  env_variables = {
    CM_API_URL             = var.cm_api_url,
    CM_API_SECRET_NAME     = "${aws_secretsmanager_secret.cm-api-secret.name}"
    CONNECTOR_EVENTS_QUEUE = var.connector_events_queue.id
  }
}
