variable "classified_created_events_consumer" {
  type = object({
    lambda_dist_dir      = string
    lambda_handler_name = string
  })
}

variable "classified_censored_events_consumer" {
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


variable "classified_events_topic_arn" {
  type = string
}
