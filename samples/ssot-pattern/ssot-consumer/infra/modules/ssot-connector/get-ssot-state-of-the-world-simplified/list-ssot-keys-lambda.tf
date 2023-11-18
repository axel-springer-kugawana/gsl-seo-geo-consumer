resource "aws_iam_role" "list_lambda_role" {
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

data "aws_iam_policy_document" "list_lambda_policy" {
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
      "s3:ListBucket"
    ]
    resources = [
       var.ssot_sotw_bucket.arn
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
    ]
    resources = [
      "${module.ssot_keys_queue.queue_arn}"
    ]
  }
}

resource "aws_iam_policy" "iam_policy_for_list_lambda" {
  policy = data.aws_iam_policy_document.list_lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role_list" {
  role       = aws_iam_role.list_lambda_role.name
  policy_arn = aws_iam_policy.iam_policy_for_list_lambda.arn
}

module "list_ssot_keys_lambda" {
  source               = "../../constructs/lambda"
  lambda_handler       = var.list_ssot_keys_lambda.handler
  lambda_function_name = "${var.application}-${var.environment}-${var.ssot_name}-list-ssot-keys"
  lambda_dist_dir      = var.list_ssot_keys_lambda.dist_dir
  runtime              = "nodejs18.x"
  lambda_role_arn      = aws_iam_role.list_lambda_role.arn
  memory_size          = "2048"
  timeout              = 14 * 60
  env_variables = {
    SSOT_SOTW_BUCKET_NAME      = var.ssot_sotw_bucket.id,
    SSOT_KEYS_QUEUE = module.ssot_keys_queue.queue_id
  }
}