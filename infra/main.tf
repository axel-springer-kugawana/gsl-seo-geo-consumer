module "cm_connector" {
  source = "./modules/cm-connector"

  bucket = {
    id = var.geo_management_sync_bucket
  }
  
  events_fifo_topic = {
    arn = var.geo_management_events_fifo_topic
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name
}

module "dynamodb-ssot-geo-updated" {
  partition_key = "AvivGeoId"
  source      = "./modules/dynamodb"
  application = "gsl-seo-geo-updated-${var.environment}"
  environment = var.environment
}


module "dynamodb-ssot-geo-deleted" {
  partition_key = "AvivGeoId"
  source      = "./modules/dynamodb"
  application = "gsl-seo-geo-deleted-${var.environment}"
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
  updated_dynamodb_arn        = module.dynamodb-ssot-geo-updated.properties.dynamodb_arn
  updated_dynamodb_table_name = module.dynamodb-ssot-geo-updated.properties.dynamodb_table_name
  deleted_dynamodb_arn        = module.dynamodb-ssot-geo-deleted.properties.dynamodb_arn
  deleted_dynamodb_table_name = module.dynamodb-ssot-geo-deleted.properties.dynamodb_table_name
}

module "geo_bulk_load" {
  source = "./modules/geo-bulk-load"

  geo_bucket = {
    id  = var.geo_management_sync_bucket
    arn = "arn:aws:s3:::${var.geo_management_sync_bucket}"
  }

  geo_bucket_kms_key_arn = var.geo_bucket_kms_key_arn

  rds = {
    cluster_identifier = var.rds_aurora_name
    database_name      = var.rds_aurora_database
    schema             = var.geo_bulk_load_db_schema
    security_group_id  = var.rds_security_group_id
  }

  schedule_expression = var.geo_bulk_load_schedule_expression
  image_tag = var.geo_bulk_load_image_tag
  application = var.application
  environment = var.environment
  geo_management_sync_bucket = var.geo_management_sync_bucket
  geo_management_bucket_key = var.geo_management_bucket_key
}
