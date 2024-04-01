
module "api" {
  source = "./modules"

  api_lambda = {
    dist_dir = "../src/dist/"
    handler  = "run.sh"
  }

  application = var.application
  environment = var.environment

}
