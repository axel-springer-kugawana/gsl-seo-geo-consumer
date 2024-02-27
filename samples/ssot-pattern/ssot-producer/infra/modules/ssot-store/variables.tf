variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "update_ssot_item_lambda" {
  type = object({
    dist_file = string,
    handler   = string
  })
}

variable "create_ssot_item_lambda" {
  type = object({
    dist_file = string,
    handler   = string
  })
}

variable "delete_ssot_item_lambda" {
  type = object({
    dist_file = string,
    handler   = string
  })
}
