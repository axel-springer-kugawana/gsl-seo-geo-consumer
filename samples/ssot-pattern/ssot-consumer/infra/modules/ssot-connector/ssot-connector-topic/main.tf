resource "aws_sns_topic" "ssot_connector_events_topic" {
  name = "${var.application}-${var.environment}-${var.ssot_name}-ssot-connector-topic"
}
