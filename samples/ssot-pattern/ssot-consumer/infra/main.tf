locals {
  ssot_bucket_arn = "arn:aws:s3:::ssot-producer-sandbox-state-of-the-world"
  ssot_bucket_id = "ssot-producer-sandbox-state-of-the-world"
  ssot_events_topic = "arn:aws:sns:eu-west-1:952085476791:ssot-producer-sandbox-ssot-events-topic"
}


module "ssot_consumer" {

  source = "./modules/ssot-connector/get-ssot-state-of-the-world"
  account_data = {
    account_id   = data.aws_caller_identity.current.account_id
    vpc_id       = data.aws_ssm_parameter.vpc_id.value
    region_name  = data.aws_region.current.name
    account_name = data.aws_ssm_parameter.account_name.value
    subnets = {
      container_subnet_1 = data.aws_ssm_parameter.container_subnet_1.value
      container_subnet_2 = data.aws_ssm_parameter.container_subnet_2.value
      container_subnet_3 = data.aws_ssm_parameter.container_subnet_3.value
    }
  }
  list_bucket_task = {
    container_cpu_units = 2048
    container_image     = "952085476791.dkr.ecr.eu-west-1.amazonaws.com/ssot-consumer-sandbox-ssot-stow-inventory:latest"
    container_memory    = 4096
  }

  ssot_sotw_bucket = {
    arn = local.ssot_bucket_arn
    id  = local.ssot_bucket_id
  }

  process_ssot_items_lambda = {
    dist_dir = "../src/dist/ssot-connector/lambda-handlers/"
    handler  = "get-ssot-items-content.handler"
  }

  ssot_consumer_queue = {
    arn = module.ssot_consumer_queue.ssot_consumer_queue_arn
    id = module.ssot_consumer_queue.ssot_consumer_queue_id
  }

  application = var.application
  environment = var.environment
}


module "ssot_consumer_queue" {

   source = "./modules/ssot-connector/ssot-consumer-internal-queue"

  ssot_topic = {
    arn = local.ssot_events_topic
  }

  application = var.application
  environment = var.environment

}

module "ssot_events_handling" {
  source = "./modules/ssot-connector/ssot-events-handling"

  process_ssot_events_lambda = {
    dist_dir                  = "../src/dist/ssot-connector/lambda-handlers/"
    handler                   = "process-ssot-events.handler"
    queue_esm_max_concurrency = 100
  }

  ssot_consumer_queue = {
    arn = module.ssot_consumer_queue.ssot_consumer_queue_arn
    id = module.ssot_consumer_queue.ssot_consumer_queue_id
  }

  application = var.application
  environment = var.environment
}
