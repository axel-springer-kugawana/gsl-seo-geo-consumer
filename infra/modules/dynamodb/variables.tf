variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "partition_key" {
  type    = string
  default = "AvivGeoId"
}

variable "range_key" {
  type    = string
  default = "Version"
}
