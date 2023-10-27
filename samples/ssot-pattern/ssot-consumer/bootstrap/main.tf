
module "ssot_consumer_bootstrap" {

    source = "./modules/ssot-consumer-bootstrap"
  
    application = var.application
    environment = var.environment
}
