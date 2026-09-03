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
  default     = "seo-gm-connector"
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

variable "geo_management_events_fifo_topic" {
  description = "geos management events fifo topic arn"
  type        = string
}

variable "queue_esm_max_concurrency" {
  description = "queue_esm_max_concurrency"
  type        = number
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
  default     = 32
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

variable "geo_management_sync_bucket" {
  description = "geo management sync bucket"
  type        = string
}

variable "geo_management_bucket_key" {
  description = "geo management bucket key"
  type        = string
}

variable "geo_dynamodb_schema_version" {
  description = "Static sort key value (\"V1\", \"V2\"...) written to the geo-feature and geo-lineage DynamoDB tables"
  type        = string
  default     = "V1"
}

variable "geo_bucket_kms_key_arn" {
  description = "KMS key ARN used to encrypt objects in the geo management sync bucket (cross-account, owned by the export team). Empty means the bucket is not KMS-encrypted"
  type        = string
  default     = ""
}


variable "rds_security_group_id" {
  description = "Security group of the aurora cluster. Set it to let the bulk load task reach the database, empty to manage the inbound rule elsewhere"
  type        = string
  default     = ""
}

variable "geo_bulk_load_db_schema" {
  description = "Schema holding the geo tables loaded from the parquet export"
  type        = string
  default     = "public"
}


variable "geo_bulk_load_schedule_expression" {
  description = "EventBridge Scheduler expression, e.g. cron(0 3 * * ? *). Empty means: run the bulk load on demand only"
  type        = string
  default     = ""
}

variable "geo_bulk_load_image_tag" {
  description = "Optional explicit ECR image tag for the geo bulk load ECS task. Leave empty to auto-select the most recent tag from ECR"
  type        = string
  default     = ""
}