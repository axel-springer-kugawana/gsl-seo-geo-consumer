variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "ssot_topic" {
  type = object({
    arn = string
  })
}
