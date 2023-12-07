module "cm_connector" {
  source = "./modules/cm-connector"
  
  bucket = {
    id = "aviv-classdisp-dev-staging-resync-bucket"
  }
  
  events_topic = {
    arn = "arn:aws:sns:eu-west-1:272575627684:classdisp-staging-dispatch-classified-event-topic"
  }

  api = {
    url = "https://classmgt-staging-api.kind-camel-dev.aws.aviv-internal.eu"
  }

  application = var.application
  environment = var.environment
  ssot_name =  "${var.ssot_name}"
}


module "cm_consumer_example" {
  source = "./modules/cm-consumer-example"
  process_cm_connector_events_lambda = {
    dist_dir                  = "../src/dist/cm-consumer-example/lambda-handlers/"
    handler                   = "process-cm-connector-events.handler"
    queue_esm_max_concurrency = 30
  }

  cm_connector_consumer_queue = {
    arn = module.cm_connector.queue_arn
    id = module.cm_connector.queue_id
  }

  application = var.application
  environment = var.environment
}
