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


variable "ssot_consumer_queue" {
  type = object({
    arn = string
    id = string
  })
}