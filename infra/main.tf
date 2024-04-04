module "cm_connector" {
  source = "./modules/cm-connector"

  bucket = {
    id = var.classified_management_sync_bucket
  }

  events_topic = {
    arn = var.classified_management_events_topic
  }

  api = {
    url = var.classified_management_api
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name
}

module "cm_consumer_example" {
  source = "./modules/cm-consumer-example"
  process_cm_connector_events_lambda = {
    dist_file                 = "../src/dist/cm-consumer-example/lambda-handlers/process-cm-connector-events.js"
    handler                   = "process-cm-connector-events.handler"
    queue_esm_max_concurrency = 30
  }

  cm_connector_consumer_queue = {
    arn = module.cm_connector.queue_arn
    id  = module.cm_connector.queue_id
  }

  application = var.application
  environment = var.environment
}
