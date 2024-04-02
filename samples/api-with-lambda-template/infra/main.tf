locals {
  eph_env_suffix = var.ephemeral && var.commit_revision != "" ? "-${substr(var.commit_revision, 0, 7)}" : ""
}

module "user_profile_management" {
  source = "./modules/user-profile-management"

  get_profile_by_id_lambda = {
    dist_file = "../src/dist/user-profile-management/lambda-handlers/get-user-profile-by-id.js"
    handler   = "get-user-profile-by-id.handler"
  }

  create_profile_lambda = {
    dist_file = "../src/dist/user-profile-management/lambda-handlers/create-user-profile.js"
    handler   = "create-user-profile.handler"
  }

  delete_profile_lambda = {
    dist_file = "../src/dist/user-profile-management/lambda-handlers/delete-user-profile.js"
    handler   = "delete-user-profile.handler"
  }

  application = var.application
  environment = var.environment

  environment_suffix                                = local.eph_env_suffix
  central_network_vpc_id_for_private_api_invocation = var.central_network_vpc_id_for_private_api_invocation
}
