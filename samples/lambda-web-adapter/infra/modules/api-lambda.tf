resource "aws_iam_role" "api_lambda" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "api_lambda" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["arn:aws:logs:*:*:*"]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = ["${aws_dynamodb_table.table.arn}"]
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "api_lambda" {
  role       = aws_iam_role.api_lambda.name
  policy_arn = aws_iam_policy.api_lambda.arn
}

module "api_lambda" {
  source               = "./constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-api"
  lambda_handler       = var.api_lambda.handler
  lambda_role_arn      = aws_iam_role.api_lambda.arn
  lambda_dist_dir      = var.api_lambda.dist_dir
  timeout              = 5
  memory_size          = "512"

  env_variables = {
    CLASSIFIEDS_TABLE       = aws_dynamodb_table.table.name,
    AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
  }
  layers = ["arn:aws:lambda:${data.aws_region.current.name}:753240598075:layer:LambdaAdapterLayerArm64:20"]
}
