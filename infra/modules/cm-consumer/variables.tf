variable "application" {
  type = string
}

variable "environment" {
  type = string
}


variable "lambda_function_name_suffix" {
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
variable "rds_arn" {
  type = string
}

variable "secret_name" {
  type = string
}

variable "rds_sg_id" {
  type = string
}

variable "dynamodb_arn" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}
