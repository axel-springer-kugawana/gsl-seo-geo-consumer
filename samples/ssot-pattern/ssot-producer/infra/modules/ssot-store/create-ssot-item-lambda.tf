resource "aws_iam_role" "create_or_update_ssot_item_lambda_role" {
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

resource "aws_iam_policy" "create_or_update_ssot_item_lambda_iam_policy" {
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
          "dynamodb:UpdateItem"
        ]
        Resource = ["${aws_dynamodb_table.state_of_world_table.arn}"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "create_or_update_ssot_item_policy_to_role_attachment" {
  role       = aws_iam_role.create_or_update_ssot_item_lambda_role.name
  policy_arn = aws_iam_policy.create_or_update_ssot_item_lambda_iam_policy.arn
}

module "create_ssot_item_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-create-ssot-item"
  lambda_handler       = var.create_ssot_item_lambda.handler
  lambda_role_arn      = aws_iam_role.create_or_update_ssot_item_lambda_role.arn
  lambda_dist_file     = var.create_ssot_item_lambda.dist_file
  timeout              = 5
  memory_size          = "512"
  env_variables = {
    SSOT_TABLE_NAME = aws_dynamodb_table.state_of_world_table.name
  }
}

module "update_ssot_item_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-update-ssot-item"
  lambda_handler       = var.update_ssot_item_lambda.handler
  lambda_role_arn      = aws_iam_role.create_or_update_ssot_item_lambda_role.arn
  lambda_dist_file     = var.update_ssot_item_lambda.dist_file
  timeout              = 5
  memory_size          = "512"
  env_variables = {
    SSOT_TABLE_NAME = aws_dynamodb_table.state_of_world_table.name
  }
}
