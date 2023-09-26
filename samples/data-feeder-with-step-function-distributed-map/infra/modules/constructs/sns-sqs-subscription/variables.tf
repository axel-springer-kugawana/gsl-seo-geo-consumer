variable "target_queue_arn" {
  type = string
}


variable "target_queue_id" {
  type = string
}


variable "source_sns_topic_arn" {
  type = string
}

variable "raw_message_delivery" {
  type = bool
  default = true
}

