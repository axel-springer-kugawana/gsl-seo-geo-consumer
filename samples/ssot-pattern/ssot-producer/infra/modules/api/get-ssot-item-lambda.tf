resource "aws_iam_role" "get_ssot_item_lambda_role" {
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

resource "aws_iam_policy" "get_ssot_item_lambda_iam_policy" {
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
        ]
        Resource = ["${var.state_of_world_table.arn}"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "get_ssot_item_policy_to_role_attachment" {
  role       = aws_iam_role.get_ssot_item_lambda_role.name
  policy_arn = aws_iam_policy.get_ssot_item_lambda_iam_policy.arn
}

module "get_ssot_item_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-get-ssot-item"
  lambda_handler       = var.get_ssot_item_lambda.handler
  lambda_role_arn      = aws_iam_role.get_ssot_item_lambda_role.arn
  lambda_dist_file     = var.get_ssot_item_lambda.dist_file
  timeout              = 5
  memory_size          = "512"
  env_variables = {
    SSOT_TABLE_NAME = var.state_of_world_table.name
  }
}
