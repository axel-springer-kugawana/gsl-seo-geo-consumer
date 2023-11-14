locals {
  ssot_bucket_arn = "arn:aws:s3:::ssot-producer-sandbox-state-of-the-world"
  ssot_bucket_id = "ssot-producer-sandbox-state-of-the-world"
  ssot_events_topic = "arn:aws:sns:eu-west-1:952085476791:ssot-producer-sandbox-ssot-events-topic"
  list_bucket_task_ecr_image = "952085476791.dkr.ecr.eu-west-1.amazonaws.com/ssot-consumer-sandbox-ssot-stow-inventory:latest"
}


module "ssot_consumer_get_state_of_the_world" {

  source = "./get-ssot-state-of-the-world"
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
    container_image     = local.list_bucket_task_ecr_image
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
    arn = module.ssot_consumer_queue.queue_arn
    id = module.ssot_consumer_queue.queue_id
  }
  
  application = var.application
  environment = var.environment
  ssot_name =  var.ssot_name
}


module "ssot_consumer_queue" {
   source = "./ssot-consumer-internal-queue"
  ssot_topic = {
    arn = local.ssot_events_topic
  }

  application = var.application
  environment = var.environment
  ssot_name =  var.ssot_name

}