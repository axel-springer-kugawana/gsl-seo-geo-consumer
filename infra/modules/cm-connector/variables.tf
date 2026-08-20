variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "ssot_name" {
    type = string
}

locals {
  prefix = "${var.application}-${var.environment}-${var.ssot_name}-connector"
}

variable events_fifo_topic {
  type = object({
    arn = string
  })
}

variable bucket {
  type = object({
      id = string
    })
}