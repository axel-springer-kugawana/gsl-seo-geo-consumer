variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "ssot_name" {
  type = string
}

variable "ssot_sotw_bucket" {
  type = object({
    id  = string,
    arn = string
  })
}


  variable "process_ssot_keys_lambda" {
  type = object({
    dist_dir = string
    handler  = string
    queue_esm_max_concurrency = string
  })
}

variable "list_ssot_keys_lambda" {
  type = object({
    dist_dir = string
    handler  = string
  })
}

variable "account_data" {
  type = object({
    account_id   = string
    account_name = string
    region_name  = string
  })
}

variable "ssot_consumer_queue" {
  type = object({
    arn = string
    id = string
  })
}

variable "get_state_of_the_world_key_batch_size" {
  type = number
  default = 30
}