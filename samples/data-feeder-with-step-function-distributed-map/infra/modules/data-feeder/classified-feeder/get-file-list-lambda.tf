resource "aws_iam_role" "list_lambda_role" {
  name =  "sync-bucket-lister-lambda"
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
      "s3:PutObject",
    ]
    resources = [
      "${var.list_of_files_bucket_arn}/*"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      "${var.classified_data_s3_bucket_arn}"
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

module "list_bucket_files_lambda" {
  source               = "../../constructs/lambda"
  lambda_handler       = "list-objects.handler"
  lambda_function_name = "${var.application}-${var.environment}-list-objects"
  lambda_dist_dir      = var.list_object_lambda_dist_dir
  runtime              = "nodejs18.x"
  lambda_role_arn      = aws_iam_role.list_lambda_role.arn
  memory_size          = "1536"
  timeout              = 13 * 60
  env_variables = {
    FILE_LIST_BUCKET = var.list_of_files_bucket_name
    CLASSIFIEDS_BUCKET_NAME = var.classified_data_s3_bucket_name
  }
}
