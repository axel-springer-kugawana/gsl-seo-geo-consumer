module "ssot_state_of_world_stores" {
  source = "./modules/ssot-store"

  update_ssot_item_lambda = {
    dist_file = "../src/dist/ssot-store/lambda-handlers/update-ssot-item.js"
    handler   = "update-ssot-item.handler"
  }

  create_ssot_item_lambda = {
    dist_file = "../src/dist/ssot-store/lambda-handlers/create-ssot-item.js"
    handler   = "create-ssot-item.handler"
  }

  delete_ssot_item_lambda = {
    dist_file = "../src/dist/ssot-store/lambda-handlers/delete-ssot-item.js"
    handler   = "delete-ssot-item.handler"
  }

  application = var.application
  environment = var.environment
}

module "ssot_api" {
  source = "./modules/api"

  get_ssot_item_lambda = {
    dist_file = "../src/dist/ssot-api/lambda-handlers/get-ssot-item-by-id.js"
    handler   = "get-ssot-item-by-id.handler"
  }

  state_of_world_table = {
    arn        = module.ssot_state_of_world_stores.state_of_world_table_arn
    name       = module.ssot_state_of_world_stores.state_of_world_table_name
    stream_arn = module.ssot_state_of_world_stores.state_of_world_table_stream_arn
  }

  ssot_table_stream_handler_lambda = {
    dist_file = "../src/dist/ssot-api/lambda-handlers/ssot-table-stream-handler.js"
    handler   = "ssot-table-stream-handler.handler"
  }

  ssot_consumers_accounts = []

  application = var.application
  environment = var.environment
}
