variable "consumer_sqs_name" {
  type = string
}

variable "retry_count" {
  type = number
  default = 10
}

variable "queue_visibility_timeout" {
   type = number
  default = 30
}