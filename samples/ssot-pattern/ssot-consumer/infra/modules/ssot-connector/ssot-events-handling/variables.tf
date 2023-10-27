variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "process_ssot_events_lambda" {
  type = object({
    dist_dir = string
    handler  = string
    queue_esm_max_concurrency = number
  })
}

variable "ssot_topic" {
  type = object({
    arn = string
  })
}
