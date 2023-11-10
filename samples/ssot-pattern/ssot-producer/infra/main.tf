
module "ssot_state_of_world_stores" {
  source = "./modules/ssot-store"

  update_ssot_item_lambda = {
    dist_dir = "../src/dist/ssot-store/lambda-handlers"
    handler  = "update-ssot-item.handler"
  }

  create_ssot_item_lambda = {
    dist_dir = "../src/dist/ssot-store/lambda-handlers"
    handler  = "create-ssot-item.handler"
  }

  delete_ssot_item_lambda = {
    dist_dir = "../src/dist/ssot-store/lambda-handlers"
    handler  = "delete-ssot-item.handler"
  }

  application = var.application
  environment = var.environment

}



module "ssot_api" {
  source = "./modules/api"

  get_ssot_item_lambda = {
    dist_dir = "../src/dist/ssot-api/lambda-handlers"
    handler  = "get-ssot-item-by-id.handler"
  }

  state_of_world_table = {
    arn  = module.ssot_state_of_world_stores.state_of_world_table_arn
    name = module.ssot_state_of_world_stores.state_of_world_table_name
    stream_arn = module.ssot_state_of_world_stores.state_of_world_table_stream_arn
  }

  ssot_table_stream_handler_lambda = {
    dist_dir = "../src/dist/ssot-api/lambda-handlers"
    handler  = "ssot-table-stream-handler.handler"
  }

  ssot_consumers_accounts = []

  application = var.application
  environment = var.environment
}
