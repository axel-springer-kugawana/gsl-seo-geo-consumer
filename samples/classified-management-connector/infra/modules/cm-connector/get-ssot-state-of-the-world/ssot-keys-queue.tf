module "ssot_keys_queue" {
  source            = "../../constructs/consumer-queue-with-dlq"
  consumer_sqs_name = "${var.application}-${var.environment}-${var.ssot_name}-ssot-keys"
  queue_visibility_timeout = 205
}
