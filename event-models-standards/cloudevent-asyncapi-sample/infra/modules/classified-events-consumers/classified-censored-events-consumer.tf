module "classified_censored_events_consuming_queue" {
    source = "../constructs/queue-with-dlq"
    name = "${var.application}-${var.environment}-classified-censored-consuming-queue"
    retry_count = 3
}


module "classified_censored_events_subscription" {
  source = "../constructs/sns-sqs-subscription"
  source_sns_topic_arn = var.classified_events_topic_arn
  target_queue_arn = module.classified_censored_events_consuming_queue.queue_arn
  target_queue_id = module.classified_censored_events_consuming_queue.queue_id
  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    type: [ "classified-censored.v1" ]
  })
}




resource "aws_iam_role" "consume_classified_censored_event_lambda_role" {
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

resource "aws_iam_policy" "consume_classified_censored_event_lambda_iam_policy" {
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
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = ["${module.classified_censored_events_consuming_queue.queue_arn}"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "classified_censored_events_consumer_policy_to_role_attachment" {
  role       = aws_iam_role.consume_classified_censored_event_lambda_role.name
  policy_arn = aws_iam_policy.consume_classified_censored_event_lambda_iam_policy.arn
}

module "classified_censored_events_consumer_lambda" {
  source               = "../constructs/lambda"
  lambda_function_name = "${var.application}-${var.environment}-classified-censored-event-consumer"
  lambda_handler       = var.classified_censored_events_consumer.lambda_handler_name
  lambda_role_arn      = aws_iam_role.consume_classified_censored_event_lambda_role.arn
  lambda_dist_dir      = var.classified_censored_events_consumer.lambda_dist_dir
  runtime              = "nodejs18.x"
  timeout              = 5
  memory_size          = "512"
  env_variables = {}
}

resource "aws_lambda_event_source_mapping" "censored_classifieds_event_source" {
  event_source_arn = module.classified_censored_events_consuming_queue.queue_arn
  function_name    = module.classified_censored_events_consumer_lambda.function_name
}
