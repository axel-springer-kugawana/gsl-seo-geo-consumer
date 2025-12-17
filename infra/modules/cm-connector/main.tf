module "cm_get_state_of_the_world" {

  source = "./get-ssot-state-of-the-world"

  ssot_sotw_bucket = {
    arn = "arn:aws:s3:::${var.bucket.id}"
    id  = var.bucket.id
  }

  process_ssot_keys_lambda = {
    dist_file                 = "../src/dist/cm-connector/lambda-handlers/process-classified-keys.js"
    handler                   = "process-classified-keys.queueHandler"
    queue_esm_max_concurrency = 100
  }

  list_ssot_keys_lambda = {
    dist_file = "../src/dist/cm-connector/lambda-handlers/list-classified-keys.js"
    handler   = "list-classified-keys.handler"
  }

  connector_internal_queue = {
    arn = module.connector_internal_queue.queue_arn
    id  = module.connector_internal_queue.queue_id
  }

  account_data = {
    account_id   = data.aws_caller_identity.current.account_id
    region_name  = data.aws_region.current.name
    account_name = data.aws_ssm_parameter.account_name.value
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name
}

module "cm_events_handling" {
  source = "./cm-events-handling"

  cm_topic = {
    arn = var.events_topic.arn
  }

  handle_cm_events_lambda = {
    dist_file                 = "../src/dist/cm-connector/lambda-handlers/handle-classifieds-events.js"
    handler                   = "handle-classifieds-events.queueHandler"
    queue_esm_max_concurrency = 100
  }

  cm_api_url = var.api.url

  connector_events_queue = {
    arn = module.connector_internal_queue.queue_arn
    id  = module.connector_internal_queue.queue_id
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name
}


module "cm_events_handling_fifo" {
  source = "./cm-events-handling"

  cm_topic = {
    arn = var.events_fifo_topic.arn
  }

  handle_cm_events_lambda = {
    dist_file                 = "../src/dist/cm-connector/lambda-handlers/handle-classifieds-events-fifo.js"
    handler                   = "handle-classifieds-events-fifo.queueHandler"
    queue_esm_max_concurrency = 100
  }

  cm_api_url = var.api.url

  connector_events_queue = {
    arn = module.connector_internal_queue_fifo.queue_arn
    id  = module.connector_internal_queue_fifo.queue_id
  }

  application = "cm-connector-fifo"
  environment = var.environment
  ssot_name   = var.ssot_name
}

module "connector_internal_queue" {
  source            = "../constructs/consumer-queue-with-dlq"
  consumer_sqs_name = "${var.application}-${var.environment}-${var.ssot_name}-connector-events"
}

module "connector_internal_queue_fifo" {
  source            = "../constructs/consumer-queue-with-dlq"
  consumer_sqs_name = "${var.application}-${var.environment}-${var.ssot_name}-connector-events-fifo"
}
