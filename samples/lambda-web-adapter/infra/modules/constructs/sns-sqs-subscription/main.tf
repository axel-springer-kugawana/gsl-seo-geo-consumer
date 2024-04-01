resource "aws_sqs_queue_policy" "subscription_policy" {
  queue_url = var.target_queue_id
  policy    = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": [
        "${var.target_queue_arn}"
      ],
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "${var.source_sns_topic_arn}"
        }
      }
    }
  ]
}
EOF
}


resource "aws_sns_topic_subscription" "sqs_target" {
  topic_arn            = var.source_sns_topic_arn
  protocol             = "sqs"
  endpoint             = var.target_queue_arn
  raw_message_delivery = var.raw_message_delivery
}


