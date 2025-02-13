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
  default     = "seeker"
}

variable "capability" {
  description = "The actor capability name"
  type        = string
  default     = "Whitelabel"
}

variable "component" {
  description = "Application component"
  type        = string
  default     = "seo-cm-connector"
}

variable "contact" {
  description = "List of contact slack channels or emails"
  type        = string
  default     = "aphrodite"
}

variable "team" {
  description = "team name"
  type        = string
  default     = "aphrodite"
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


variable "classified_management_sync_bucket" {
  description = "classified management sync bucket name"
  type        = string
}

variable "classified_management_events_topic" {
  description = "classified management events topic arn"
  type        = string
}

variable "classified_management_api" {
  description = "classified management api"
  type        = string
}

variable "aws_account_name" {
  type        = string
  description = "AWS account name or workspace."
}

variable "rds_aurora_name" {
  description = "The name of the aurora cluster"
  type        = string
  default     = "aviv-seeker-whitelabel-seo-ssot-db"
}

variable "rds_aurora_username" {
  description = "The username of the admin user of the aurora cluster"
  type        = string
  default     = "main_user"
}

variable "rds_aurora_database" {
  description = "The database name of the aurora cluster"
  type        = string
  default     = "ssot"
}

variable "rds_aurora_port" {
  description = "The port name of the aurora cluster"
  type        = string
  default     = 5432
}

variable "rds_engine_mode" {
  description = "The instance type of the aurora cluster"
  type        = string
  default     = "serverless"
}

variable "rds_acu_min" {
  description = "min acu for serverless configuration"
  type        = string
  default     = 0.5
}

variable "rds_acu_max" {
  description = "max acu for serverless configuration"
  type        = string
  default     = 8
}

variable "rds_aurora_postgres_version" {
  description = "The postgres version of the aurora cluster"
  type        = string
  default     = "11.21"
}

variable "suffix" {
  type    = string
  default = ""
}