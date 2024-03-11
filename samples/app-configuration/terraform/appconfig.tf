module "appconfig_freeform" {
  source   = "./modules/appconfig_freeform"
  app_name = var.service_name
  profiles = {

    ProgressiveRollout = {
      content_type = "application/json",
      content = jsonencode({
        "enabled"        = "true",
        "whiteListedIds" = [123, 456, 789]
      })
    }

  }
}
