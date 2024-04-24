variable "environment" {
  description = "The name of the environment"
  type        = string

  validation {
    condition     = contains(["sandbox", "dev", "preview", "live"], var.environment)
    error_message = "Valid values for var: environment_variable are (sandbox, dev, preview, live)."
  }
}

variable "application" {
  description = "The name of the application"
  type        = string
}

variable "rds_aurora_name" {
  description = "The name of the aurora cluster"
  type        = string
}

variable "rds_aurora_username" {
  description = "The username of the admin user of the aurora cluster"
  type        = string
}

variable "rds_aurora_database" {
  description = "The database name of the aurora cluster"
  type        = string
}

variable "rds_aurora_port" {
  description = "The port name of the aurora cluster"
  type        = string
  default     = "5432"
}

variable "rds_engine_mode" {
  description = "The instance type of the aurora cluster"
  type        = string
  default     = "db.serverless"
}

variable "rds_aurora_postgres_version" {
  description = "The postgres version of the aurora cluster"
  type        = string
  default     = "15.3"
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

variable "vpc_id" {
  description = "The vpc id used by the database"
  type        = string
}

variable "subnets" {
  description = "The subnet ids used by the database"
  type        = list(string)
}

variable "env_cidr" {
  description = "The cidrs used by the database"
  type        = list(string)
}

variable "suffix" {
  type    = string
  default = ""
}


variable "aws_environment" {
  type    = string
  default = "dev"
}


variable "ssot_name" {
  type = string
}

variable "proxy_idle_client_timeout" {
  type        = number
  description = "The number of seconds that a connection to the proxy can be inactive before the proxy disconnects it"
  default     = 1800
}

variable "proxy_max_connections_percent" {
  type        = number
  description = "The maximum size of the connection pool for each target in a target group"
  default     = 100
}

variable "proxy_max_idle_connections_percent" {
  type        = number
  description = "The maximum size of the connection pool for each target in a target group"
  default     = 50
}

variable "proxy_connection_borrow_timeout" {
  type        = number
  description = "The number of seconds for a proxy to wait for a connection to become available in the connection pool"
  default     = 120
}
