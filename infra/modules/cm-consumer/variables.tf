variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "process_cm_connector_events_lambda" {
  type = object({
    dist_file                 = string
    handler                   = string
    queue_esm_max_concurrency = number
  })
}

variable "cm_connector_consumer_queue" {
  type = object({
    arn = string
    id  = string
  })
}
variable "ssot_name" {
  type = string
}
 

variable "feature_dynamodb_arn" {
  type = string
}

variable "feature_dynamodb_table_name" {
  type = string
}

variable "lineage_dynamodb_arn" {
  type = string
}

variable "lineage_dynamodb_table_name" {
  type = string
}

variable "geo_dynamodb_schema_version" {
  type = string
}
