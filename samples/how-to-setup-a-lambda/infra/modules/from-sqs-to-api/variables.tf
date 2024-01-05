variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = set(string)
}

variable "queue_arn" {
  type = string
}
