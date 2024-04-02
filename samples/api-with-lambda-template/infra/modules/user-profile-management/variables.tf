variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "get_profile_by_id_lambda" {
  type = object({
    dist_file = string,
    handler   = string
  })
}

variable "create_profile_lambda" {
  type = object({
    dist_file = string,
    handler   = string
  })
}

variable "delete_profile_lambda" {
  type = object({
    dist_file = string,
    handler   = string
  })
}


variable "central_network_vpc_id_for_private_api_invocation" {
  type = string
}
