variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "api_lambda" {
  type = object({
    dist_dir = string,
    handler  = string
  })
}


