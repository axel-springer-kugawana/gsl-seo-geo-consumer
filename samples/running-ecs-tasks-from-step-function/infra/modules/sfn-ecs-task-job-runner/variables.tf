variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "container_image" {
  type = string
}

variable "container_cpu_units" {
  type = number
  default = 256
}

variable "container_memory" {
  type = number
  default = 512
}
