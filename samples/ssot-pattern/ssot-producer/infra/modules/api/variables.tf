variable "application" {
  type = string  
}

variable "environment" {
  type = string  
}

variable "state_of_world_table" {
  type = object({
    arn = string,
    name = string,
    stream_arn = string
  })
}

variable "get_ssot_item_lambda" {
  type = object({
    dist_dir = string,
    handler = string 
  })
}

variable "ssot_consumers_accounts" {
  type = list(string)
  description = "(optional) describe your variable"
}

variable "ssot_table_stream_handler_lambda" {
  type = object({
    dist_dir = string,
    handler = string 
  })
}