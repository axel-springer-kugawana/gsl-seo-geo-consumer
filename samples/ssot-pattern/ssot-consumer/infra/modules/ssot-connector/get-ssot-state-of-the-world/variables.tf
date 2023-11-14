variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "ssot_name" {
  type = string
}

variable "list_bucket_task" {
  type = object({
    container_image     = string,
    container_cpu_units = number
    container_memory    = number
  })
}

variable "ssot_sotw_bucket" {
  type = object({
    id  = string,
    arn = string
  })
}


variable "process_ssot_items_lambda" {
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
    vpc_id       = string
    subnets = object({
      container_subnet_1 = string
      container_subnet_2 = string
      container_subnet_3 = string
    })
  })
}

variable "ssot_consumer_queue" {
  type = object({
    arn = string
    id = string
  })
}