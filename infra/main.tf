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
}

module "cm_consumer_example" {
  # depends_on = [module.rds]
  source = "./modules/cm-consumer-example"
  process_cm_connector_events_lambda = {
    dist_file                 = "../src/dist/cm-consumer-example/lambda-handlers/process-cm-connector-events.js"
    handler                   = "process-cm-connector-events.handler"
    queue_esm_max_concurrency = 3
  }
  cm_connector_consumer_queue = {
    arn = module.cm_connector.queue_arn
    id  = module.cm_connector.queue_id
  }

  ssot_name          = var.ssot_name
  application        = var.application
  environment        = var.environment
  rds_arn            = module.rds.arn #module.rds.proxy_arn
  secret_arn         = module.rds.secret_arn
  secret_name        = module.rds.secret_name
  rds_sg_id          = module.rds.sg_id
  geo_places_api_url = var.geo_places_api_url
}
