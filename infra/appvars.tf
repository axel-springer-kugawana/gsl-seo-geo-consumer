variable "application" {
  description = "Application name"
  type        = string
  default     = "cm-sample"
}

variable "ssot_name" {
  description = "SSoT name"
  type        = string
  default     = "classifieds"
}

variable "geo_places_api_url" {
  type        = string
  description = "Base URL to the geo places api"
}
