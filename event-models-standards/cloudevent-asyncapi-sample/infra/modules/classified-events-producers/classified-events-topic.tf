resource "aws_sns_topic" "classified_events_topic" {
  name = "${var.application}-${var.environment}-classified-events-topic"
}
