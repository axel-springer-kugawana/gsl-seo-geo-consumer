module "cm_events_consumer_queue" {
  source            = "../../constructs/consumer-queue-with-dlq"
  consumer_sqs_name = "${var.application}-${var.environment}-${var.ssot_name}-events-queue"
}


module "cm_events_queue_subscription" {
  source               = "../../constructs/sns-sqs-subscription"
  source_sns_topic_arn = var.cm_topic.arn
  target_queue_arn     = module.cm_events_consumer_queue.queue_arn
  target_queue_id      = module.cm_events_consumer_queue.queue_id
}
