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


variable bucket {
type = object({
    id = string
  })
}

variable ssot_events_topic {
  type = object({
    arn = string
  })
}
