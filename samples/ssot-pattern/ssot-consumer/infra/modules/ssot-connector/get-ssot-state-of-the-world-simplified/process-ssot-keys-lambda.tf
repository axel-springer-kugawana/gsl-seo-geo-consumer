resource "aws_lambda_event_source_mapping" "lambda_event_source" {
  event_source_arn        = module.ssot_keys_queue.queue_arn
  function_name           = module.process_ssot_keys_lambda.function_name
  function_response_types = ["ReportBatchItemFailures"]
  scaling_config {
    maximum_concurrency = var.process_ssot_keys_lambda.queue_esm_max_concurrency
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
      "s3:getObject",
    ]
    resources = [
      "${var.ssot_sotw_bucket.arn}/*"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
    ]
    resources = [
      "${var.ssot_consumer_queue.arn}"
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
      "${module.ssot_keys_queue.queue_arn}"
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

module "process_ssot_keys_lambda" {
  source               = "../../constructs/lambda"
  lambda_handler       = var.process_ssot_keys_lambda.handler
  lambda_function_name = "${var.application}-${var.environment}-${var.ssot_name}-process-ssot-keys"
  lambda_dist_dir      = var.process_ssot_keys_lambda.dist_dir
  runtime              = "nodejs18.x"
  lambda_role_arn      = aws_iam_role.lambda_role.arn
  memory_size          = "512"
  timeout              = 60
  env_variables = {
    SSOT_SOTW_BUCKET_NAME      = var.ssot_sotw_bucket.id,
    INTERNAL_SSOT_EVENTS_QUEUE = var.ssot_consumer_queue.id,
    SSOT_NAME = var.ssot_name
  }
}

