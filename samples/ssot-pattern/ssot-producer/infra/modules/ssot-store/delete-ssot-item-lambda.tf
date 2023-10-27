resource "aws_iam_role" "delete_ssot_item_lambda_role" {
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

resource "aws_iam_policy" "delete_ssot_item_lambda_iam_policy" {
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
            "dynamodb:DeleteItem"
        ]
        Resource = ["${aws_dynamodb_table.state_of_world_table.arn}"]
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "delete_ssot_item_policy_to_role_attachment" {
  role       = aws_iam_role.delete_ssot_item_lambda_role.name
  policy_arn = aws_iam_policy.delete_ssot_item_lambda_iam_policy.arn
}

module "delete_ssot_item_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-delete-ssot-item"
  lambda_handler       = var.delete_ssot_item_lambda.handler
  lambda_role_arn      = aws_iam_role.delete_ssot_item_lambda_role.arn
  lambda_dist_dir      = var.delete_ssot_item_lambda.dist_dir
  runtime              = "nodejs18.x"
  timeout              = 5
  memory_size          = "512"
  env_variables = {
    SSOT_TABLE_NAME = aws_dynamodb_table.state_of_world_table.name
  }
}