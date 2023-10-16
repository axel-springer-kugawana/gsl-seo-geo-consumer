resource "aws_iam_role" "lambda_role" {
  name = "sync-bucket-reader"
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
      "${var.classified_data_s3_bucket_arn}/*"
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

module "classified_feeder_handling_lambda" {
  source               = "../../constructs/lambda"
  lambda_handler       = "classified-feeder.handler"
  lambda_function_name = "${var.application}-${var.environment}-classified-feeder-handler"
  lambda_dist_dir      = var.classified_feeder_lambda_dist_dir
  runtime              = "nodejs18.x"
  lambda_role_arn      = aws_iam_role.lambda_role.arn
  memory_size          = "512"
  timeout = 60
  env_variables = {
    CLASSIFIEDS_BUCKET_NAME = var.classified_data_s3_bucket_name
  }
}