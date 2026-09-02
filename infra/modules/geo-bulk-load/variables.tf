variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "geo_bucket" {
  description = "Bucket holding the geo parquet export"
  type = object({
    id  = string
    arn = string
  })
}

variable "geo_bucket_kms_key_arn" {
  description = "KMS key ARN used to encrypt the geo parquet export objects. Empty means the bucket is not KMS-encrypted"
  type        = string
  default     = ""
}

variable "rds" {
  description = "Existing aurora postgres cluster this task loads into"
  type = object({
    cluster_identifier = string
    # Empty means: keep the database name of the cluster.
    database_name = optional(string, "")
    schema        = optional(string, "public")
    # Empty means: do not touch the inbound rules of the cluster.
    security_group_id = optional(string, "")
  })
}

variable "image_tag" {
  description = "Explicit ECR image tag. If empty, Terraform selects the most recently pushed tagged image from the repository"
  type        = string
  default     = ""
}

variable "task_cpu" {
  description = "Fargate cpu units. 8192 allows 16384 to 61440 MiB of memory"
  type        = number
  default     = 8192
}

variable "task_memory" {
  description = "Fargate memory in MiB"
  type        = number
  default     = 61440
}

variable "duckdb_memory_limit" {
  description = "DuckDB memory_limit setting. Keep well below task_memory to leave room for node/pg and avoid OOM kills"
  type        = string
  default     = "45GB"
}

variable "ephemeral_storage_gib" {
  description = "Local storage, used by the duckdb temp directory when a scan spills"
  type        = number
  default     = 40
}

variable "snapshot_prefix" {
  description = "Prefix under which the export drops one folder per snapshot"
  type        = string
  default     = "miracle/snowflake/"
}

variable "snapshot_suffix" {
  description = "Only snapshot folders ending with this suffix are candidates"
  type        = string
  default     = "-live"
}

variable "schedule_expression" {
  description = "EventBridge Scheduler expression, e.g. cron(0 3 * * ? *). Empty means: run the task on demand only"
  type        = string
  default     = ""
}

variable "cloudwatch_log_retention" {
  type    = number
  default = 30
}

locals {
  name = "${var.application}-${var.environment}-geo-bulk-load"
}


variable "geo_management_sync_bucket" {
  description = "geo management sync bucket"
  type        = string
}

variable "geo_management_bucket_key" {
  description = "geo management bucket path"
  type        = string
}

variable "geo_dynamodb_table" {
  description = "DynamoDB table backed up into by processMassiveSqlToDynamoDB (reuses the ssot-geo-updated table)"
  type = object({
    arn  = string
    name = string
  })
}