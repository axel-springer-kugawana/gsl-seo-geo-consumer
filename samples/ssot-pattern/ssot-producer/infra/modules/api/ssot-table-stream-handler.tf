resource "aws_iam_role" "ssot_table_stream_handler_lambda_role" {
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

resource "aws_iam_policy" "ssot_table_stream_handler_lambda_iam_policy" {
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
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = ["${var.state_of_world_table.arn}/stream/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = ["${var.state_of_world_table.arn}/stream/*"]
      },

      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:CopyObject",
          "s3:DeleteObject",
        ]
        Resource = [
          "${aws_s3_bucket.state_of_world_bucket.arn}",
          "${aws_s3_bucket.state_of_world_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:PublishBatch",
          "sns:Publish",

        ]
        Resource = [
          aws_sns_topic.ssot_events_topic.arn,
        ]
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "ssot_table_stream_handler_policy_to_role_attachment" {
  role       = aws_iam_role.ssot_table_stream_handler_lambda_role.name
  policy_arn = aws_iam_policy.ssot_table_stream_handler_lambda_iam_policy.arn
}

module "ssot_table_stream_handler_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-ssot-table-stream-handler"
  lambda_handler       = var.ssot_table_stream_handler_lambda.handler
  lambda_role_arn      = aws_iam_role.ssot_table_stream_handler_lambda_role.arn
  lambda_dist_dir      = var.ssot_table_stream_handler_lambda.dist_dir
  timeout              = 5
  memory_size          = "512"
  env_variables = {
    STATE_OF_WORLD_BUCKET = aws_s3_bucket.state_of_world_bucket.id
    SSOT_TOPIC_ARN        = aws_sns_topic.ssot_events_topic.arn
  }
}

resource "aws_lambda_event_source_mapping" "ssot_table_stream_handler_event_source" {
  event_source_arn        = var.state_of_world_table.stream_arn
  function_name           = module.ssot_table_stream_handler_lambda.function_name
  starting_position       = "TRIM_HORIZON"
  function_response_types = ["ReportBatchItemFailures"]

}
