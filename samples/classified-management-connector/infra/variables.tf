variable "environment" {
  description = "The environment of the application"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["sandbox", "dev", "preview", "live"], var.environment)
    error_message = "Valid values for var: environment_variable are (sandbox, dev, preview, live)."
  }
}

variable "costCenter" {
  description = "cost center of workloads"
  type        = string
  default     = "aviv"
}

variable "domain" {
  description = "The actor domain name"
  type        = string
  default     = "architecture"
}

variable "capability" {
  description = "The actor capability name"
  type        = string
  default     = "Not Applicable"
}

variable "component" {
  description = "Application component"
  type        = string
  default     = "cm-connector"
}

variable "contact" {
  description = "List of contact slack channels or emails"
  type        = string
  default     = "aviv_backend_guild"
}

variable "team" {
  description = "team name"
  type        = string
  default     = "architecture"
}

variable "taggingVersion" {
  description = "tagging version"
  type        = string
  default     = "2.0.0"
}

variable "defaultRegion" {
  description = "default region"
  type        = string
  default     = "eu-west-1"
}

variable "dataClassification" {
  description = "Resource data classificatrion"
  type        = string
  default     = "internal"
}
