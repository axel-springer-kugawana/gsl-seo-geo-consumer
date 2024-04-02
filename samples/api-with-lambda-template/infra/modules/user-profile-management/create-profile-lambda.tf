resource "aws_iam_role" "create_profile_lambda_role" {
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

data "aws_iam_policy_document" "create_profile_lambda_policy" {
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
      "dynamodb:PutItem",
    ]
    resources = [
      aws_dynamodb_table.user_profile_table.arn
    ]
  }
}

resource "aws_iam_policy" "iam_policy_for_create_profile_handler_lambda" {
  policy = data.aws_iam_policy_document.create_profile_lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role_create_profile_handler" {
  role       = aws_iam_role.create_profile_lambda_role.name
  policy_arn = aws_iam_policy.iam_policy_for_create_profile_handler_lambda.arn
}

module "create_profile_lambda" {
  source               = "../constructs/lambda"
  lambda_handler       = var.create_profile_lambda.handler
  lambda_function_name = "${var.application}-${var.environment}${var.environment_suffix}-create"
  lambda_dist_file     = var.create_profile_lambda.dist_file
  lambda_role_arn      = aws_iam_role.create_profile_lambda_role.arn
  memory_size          = "512"
  timeout              = 25
  env_variables = {
    USER_PROFILE_TABLE = aws_dynamodb_table.user_profile_table.name
  }
}
