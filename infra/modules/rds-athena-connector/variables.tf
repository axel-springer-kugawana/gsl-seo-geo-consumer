variable "db" {
  type = object({
    name              = string
    cluster_endpoint  = string
    secret_name       = string
    security_group_id = string
  })
}

variable "application" {
  type = string
}

variable "environment" {
  type = string
}
