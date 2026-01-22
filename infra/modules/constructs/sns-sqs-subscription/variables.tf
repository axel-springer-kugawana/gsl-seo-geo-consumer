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


variable "filter_policy" {
  type        = string
  description = "Filter policy for the subscription jsonencode value"
  default     = null
}

variable "filter_policy_scope" {
  type        = string
  description = "Filter policy scope for the subscription jsonencode value"
  default     = null
}