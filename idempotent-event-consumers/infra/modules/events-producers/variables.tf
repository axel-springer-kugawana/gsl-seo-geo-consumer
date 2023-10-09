variable "classified_censored_events_producer" {
  type = object({
    lambda_dist_dir      = string
    lambda_handler_name = string
  })
}

variable "application" {
  type = string  
}

variable "environment" {
  type = string  
}