module "ssot_connector_classifieds" {
  source = "./modules/ssot-connector"
  bucket = {
    id = "ssot-sandbox-state-of-the-world"
  }
  ssot_events_topic = {
    arn = "arn:aws:sns:eu-west-1:952085476791:ssot-sandbox-ssot-events-topic"
  }
  application = var.application
  environment = var.environment
  ssot_name =  "${var.ssot_name}"
}


module "ssot_consumer_example" {
  source = "./modules/ssot-consumer-example"
  process_ssot_events_lambda = {
    dist_dir                  = "../src/dist/ssot-consumer-example/lambda-handlers/"
    handler                   = "process-ssot-events.handler"
    queue_esm_max_concurrency = 30
  }

  ssot_consumer_queue = {
    arn = module.ssot_connector_classifieds.queue_arn
    id = module.ssot_connector_classifieds.queue_id
  }

  application = var.application
  environment = var.environment
}
