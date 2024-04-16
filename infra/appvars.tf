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

variable "rds_aurora_postgres_version" {
  description = "The postgres version of the aurora cluster"
  type        = string
  default     = "16.1"
}

variable "rds_acu_min" {
  description = "min acu for serverless configuration"
  type        = string
  default     = 4
}

variable "rds_acu_max" {
  description = "max acu for serverless configuration"
  type        = string
  default     = 128
}
