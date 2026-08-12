module "cm_connector" {
  source = "./modules/cm-connector"

  events_fifo_topic = {
    arn = var.geo_management_events_fifo_topic
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name
}

module "dynamodb-ssot-classified" {
  partition_key = "AvivGeoId"
  source      = "./modules/dynamodb"
  application = "gsl-seo-geo-ssot-${var.environment}"
  environment = var.environment
} 

module "cm_consumer_fifo" {
  # depends_on = [module.cm_connector, module.rds, module.dynamodb]
  source = "./modules/cm-consumer"
  process_cm_connector_events_lambda = {
    dist_file                 = "../src/dist/cm-consumer/lambda-handlers/process-cm-connector-geo-events-fifo.js"
    handler                   = "process-cm-connector-geo-events-fifo.handler"
    queue_esm_max_concurrency = var.queue_esm_max_concurrency
  }
  cm_connector_consumer_queue = {
    arn = module.cm_connector.queue_fifo_arn
    id  = module.cm_connector.queue_fifo_id
  } 
  ssot_name    = var.ssot_name
  application  = "gm-consumer-fifo"
  environment  = var.environment  
  dynamodb_arn = module.dynamodb-ssot-classified.properties.dynamodb_arn
  dynamodb_table_name = module.dynamodb-ssot-classified.properties.dynamodb_table_name
}
