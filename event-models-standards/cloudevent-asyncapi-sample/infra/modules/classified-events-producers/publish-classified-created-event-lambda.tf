resource "aws_iam_role" "publish_classified_created_event_lambda_role" {
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

resource "aws_iam_policy" "publish_classified_created_event_lambda_iam_policy" {
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
          "sns:Publish"
        ]
        Resource = ["${aws_sns_topic.classified_events_topic.arn}"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "classified_created_events_producer_policy_to_role_attachment" {
  role       = aws_iam_role.publish_classified_created_event_lambda_role.name
  policy_arn = aws_iam_policy.publish_classified_created_event_lambda_iam_policy.arn
}

module "classified_created_events_producer_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-classified-created-event-publisher"
  lambda_handler       = var.classified_created_events_producer.lambda_handler_name
  lambda_role_arn      = aws_iam_role.publish_classified_created_event_lambda_role.arn
  lambda_dist_dir      = var.classified_created_events_producer.lambda_dist_dir
  runtime              = "nodejs18.x"
  timeout              = 5
  memory_size          = "512"
  env_variables = {
    "CLASSIFIEDS_EVENTS_TOPIC" : aws_sns_topic.classified_events_topic.arn
  }
}
