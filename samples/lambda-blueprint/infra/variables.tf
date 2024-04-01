variable "environment" {
  description = "The environment of the application"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["sandbox", "eph", "dev", "preview", "live"], var.environment)
    error_message = "Valid values for var: environment_variable are (sandbox, eph, dev, preview, live)."
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
  default     = "platform"
}

variable "capability" {
  description = "The actor capability name"
  type        = string
  default     = "Not Applicable"
}

variable "component" {
  description = "Application component"
  type        = string
  default     = "lambda-blueprint"
}

variable "contact" {
  description = "List of contact slack channels or emails"
  type        = string
  default     = "aviv_backend_guild"
}

variable "team" {
  description = "team name"
  type        = string
  default     = "architecture guild"
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

variable "commit_revision" {
  type    = string
  default = ""
}


variable "ephemeral" {
  type    = bool
  default = false
}

variable "create_test_harness" {
  type    = bool
  default = false
}

variable "application" {
  description = "Application name"
  type        = string
  default     = "lambda-blueprint"
}

variable "central_network_vpc_id_for_private_api_invocation" {
  description = "VPC ID for private api invocation"
  type        = string
  default     = "vpc-01b88fada1e797866"
}


