resource "aws_sns_topic" "ssot_events_topic" {
  name = "${var.application}-${var.environment}-ssot-events-topic"
}

resource "aws_sns_topic_policy" "ssot_events_topic_policy" {
  count  = length(var.ssot_consumers_accounts) > 0 ? 1 : 0
  arn    = aws_sns_topic.ssot_events_topic.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    principals {
      type        = "AWS"
      identifiers = var.ssot_consumers_accounts
    }
    effect = "Allow"
    actions = [
      "SNS:Subscribe",
    ]
    resources = [
      aws_sns_topic.ssot_events_topic.arn,
    ]

  }
}
