variable "app_name" {
  type = string
}

variable "profiles" {
  type = map(object({
    content      = string
    content_type = string
  }))
}

resource "aws_appconfig_application" "default" {
  name = var.app_name
}

resource "aws_appconfig_environment" "default" {
  name           = "default"
  application_id = aws_appconfig_application.default.id
}

resource "aws_appconfig_configuration_profile" "config" {
  for_each       = var.profiles
  name           = each.key
  application_id = aws_appconfig_application.default.id
  location_uri   = "hosted"
  type           = "AWS.Freeform"
}

resource "aws_appconfig_hosted_configuration_version" "config" {
  for_each                 = var.profiles
  application_id           = aws_appconfig_application.default.id
  configuration_profile_id = aws_appconfig_configuration_profile.config[each.key].configuration_profile_id
  content_type             = each.value.content_type
  content                  = each.value.content
}

resource "aws_appconfig_deployment_strategy" "instant" {
  name                           = "Instant"
  deployment_duration_in_minutes = 0
  growth_factor                  = 100
  replicate_to                   = "NONE"
}

resource "aws_appconfig_deployment" "default" {
  for_each                 = var.profiles
  application_id           = aws_appconfig_application.default.id
  configuration_profile_id = aws_appconfig_configuration_profile.config[each.key].configuration_profile_id
  configuration_version    = aws_appconfig_hosted_configuration_version.config[each.key].version_number
  deployment_strategy_id   = aws_appconfig_deployment_strategy.instant.id
  environment_id           = aws_appconfig_environment.default.environment_id
}

output "application_arn" {
  value = aws_appconfig_application.default.arn
}

