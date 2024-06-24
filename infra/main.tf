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


module "dynamodb" {
  source      = "./modules/dynamodb"
  application = "seo-ssot-classified"
  environment = var.environment

}

module "rds" {
  source                      = "./modules/rds"
  application                 = "seo-ssot-classified"
  environment                 = var.environment
  rds_aurora_name             = var.rds_aurora_name
  rds_aurora_username         = var.rds_aurora_username
  rds_aurora_database         = var.rds_aurora_database
  rds_aurora_port             = var.rds_aurora_port
  rds_engine_mode             = var.rds_engine_mode
  rds_aurora_postgres_version = var.rds_aurora_postgres_version
  rds_acu_min                 = var.rds_acu_min
  rds_acu_max                 = var.rds_acu_max
  vpc_id                      = data.aws_vpc.foundation_vpc.id
  subnets                     = data.aws_subnets.foundation_data_subnets.ids
  env_cidr                    = data.aws_ec2_managed_prefix_list.env_cidr.entries[*].cidr
  suffix                      = var.suffix
  ssot_name                   = var.ssot_name
  aws_account_name            = var.aws_account_name
}

module "rds_athena_connector" {
  count       = 1 #var.environment == "live" ? 0 : 1
  source      = "./modules/rds-athena-connector"
  application = var.application
  environment = var.environment
  db          = module.rds.properties
  depends_on  = [module.rds]
}

module "cm_consumer" {
  # depends_on = [module.cm_connector, module.rds, module.dynamodb]
  source = "./modules/cm-consumer"
  process_cm_connector_events_lambda = {
    dist_file                 = "../src/dist/cm-consumer/lambda-handlers/process-cm-connector-events.js"
    handler                   = "process-cm-connector-events.handler"
    queue_esm_max_concurrency = 5
  }
  cm_connector_consumer_queue = {
    arn = module.cm_connector.queue_arn
    id  = module.cm_connector.queue_id
  }

  ssot_name    = var.ssot_name
  application  = var.application
  environment  = var.environment
  rds_arn      = module.rds.proxy_arn #module.rds.arn #
  secret_name  = module.rds.secret_name
  rds_sg_id    = module.rds.sg_id
  dynamodb_arn = module.dynamodb.properties.dynamodb_arn
  dynamodb_table_name = module.dynamodb.properties.dynamodb_table_name
}
