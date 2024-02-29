module "appconfig_freeform" {
  source   = "./modules/appconfig_freeform"
  app_name = var.service_name
  profiles = {

    Avengers = {
      content_type = "application/json"
      content = jsonencode({
        base = "Stark Tower",
        members = [
          "Ironman",
          "Hulk",
          "Thor",
        ]
      })
    }

  }
}
