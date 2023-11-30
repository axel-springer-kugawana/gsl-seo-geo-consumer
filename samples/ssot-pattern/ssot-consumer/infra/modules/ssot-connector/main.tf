module "ssot_consumer_get_state_of_the_world_simplified" {

  source = "./get-ssot-state-of-the-world-simplified"

  ssot_sotw_bucket = {
    arn = "arn:aws:s3:::${var.bucket.id}"
    id  = var.bucket.id
  }

  process_ssot_keys_lambda = {
    dist_dir                  = "../src/dist/ssot-connector/lambda-handlers/"
    handler                   = "get-ssot-items-content.queueHandler"
    queue_esm_max_concurrency = 100
  }

  list_ssot_keys_lambda = {
    dist_dir = "../src/dist/ssot-connector/lambda-handlers/"
    handler  = "list-ssot-items.handler"
  }

  ssot_consumer_queue = {
    arn = module.ssot_consumer_queue.queue_arn
    id  = module.ssot_consumer_queue.queue_id
  }

  account_data = {
    account_id   = data.aws_caller_identity.current.account_id
    region_name  = data.aws_region.current.name
    account_name = data.aws_ssm_parameter.account_name.value
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name
}



module "ssot_consumer_queue" {
  source = "./ssot-consumer-internal-queue"
  ssot_topic = {
    arn = var.ssot_events_topic.arn
  }

  application = var.application
  environment = var.environment
  ssot_name   = var.ssot_name

}
