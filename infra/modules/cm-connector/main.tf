module "cm_events_handling_fifo" {
  source = "./cm-events-handling"

  cm_topic = {
    arn = var.events_fifo_topic.arn
  }

  handle_cm_events_lambda = {
    dist_file                 = "../src/dist/cm-connector/lambda-handlers/handle-geo-events-fifo.js"
    handler                   = "handle-geo-events-fifo.queueHandler"
    queue_esm_max_concurrency = 100
  }

  connector_events_queue = {
    arn = module.connector_internal_queue_fifo.queue_arn
    id  = module.connector_internal_queue_fifo.queue_id
  }

  application = "gm-connector-fifo"
  environment = var.environment
  ssot_name   = var.ssot_name
}

module "connector_internal_queue_fifo" {
  source            = "../constructs/consumer-queue-with-dlq"
  consumer_sqs_name = "${var.application}-${var.environment}-${var.ssot_name}-connector-events-fifo"
}

