module "ssot_events_consumer_queue" {
  source            = "../../constructs/consumer-queue-with-dlq"
  consumer_sqs_name = "${var.application}-${var.environment}-${var.ssot_name}-ssot-events"
}


module "ssot_events_queue_subscription" {
  source               = "../../constructs/sns-sqs-subscription"
  source_sns_topic_arn = var.ssot_topic.arn
  target_queue_arn     = module.ssot_events_consumer_queue.queue_arn
  target_queue_id      = module.ssot_events_consumer_queue.queue_id
}
