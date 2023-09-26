variable "application" {
  description = "Application name"
  type        = string
  default     = "distributed-map-test"
}

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

variable "team" {
  description = "team name"
  type        = string
  default     = "architecture"
}

variable "component" {
  description = "Application purpose"
  type        = string
  default     = "distributed-map-test-sample"
}

variable "taggingVersion" {
  description = "tagging version"
  type        = string
  default     = "1.0.0"
}


