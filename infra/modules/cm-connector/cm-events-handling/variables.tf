variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "ssot_name" {
  type = string
}

variable "cm_topic" {
  type = object({
    arn = string
  })
}

variable "connector_events_queue" {
  type = object({
    arn = string
    id  = string
  })
}

variable "handle_cm_events_lambda" {
  type = object({
    dist_file                 = string
    handler                   = string
    queue_esm_max_concurrency = string
  })
}

