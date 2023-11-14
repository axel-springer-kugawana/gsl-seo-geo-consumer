module "ssot_connector_classifieds" {
  source = "./modules/ssot-connector"
  bucket = {
    id = "ssot-producer-sandbox-state-of-the-world"
    arn = "arn:aws:s3:::ssot-producer-sandbox-state-of-the-world"
  }
  events_topic_arn = "arn:aws:sns:eu-west-1:952085476791:ssot-producer-sandbox-ssot-events-topic"
  application = var.application
  environment = var.environment
  ssot_name = "classifieds"
}

module "ssot_events_handling" {
  source = "./modules/ssot-events-handling"
  process_ssot_events_lambda = {
    dist_dir                  = "../src/dist/ssot-events-handling/lambda-handlers/"
    handler                   = "process-ssot-events.handler"
    queue_esm_max_concurrency = 100
  }

  ssot_consumer_queue = {
    arn = module.ssot_connector_classifieds.queue_arn
    id = module.ssot_connector_classifieds.queue_id
  }

  application = var.application
  environment = var.environment
}
