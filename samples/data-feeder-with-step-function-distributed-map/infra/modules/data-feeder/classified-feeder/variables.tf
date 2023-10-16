variable "application" {
  type = string
}

variable "environment" {
  type = string
}

variable "classified_data_topic_arn" {
  type = string
}

variable "classified_feeder_lambda_dist_dir" {
  type = string
}

variable "list_object_lambda_dist_dir" {
  type = string
}

variable "classified_data_s3_bucket_arn" {
  type = string
}

variable "classified_data_s3_bucket_name" {
  type = string
}

variable "list_of_files_bucket_name" {
  type = string
}

variable "list_of_files_bucket_arn" {
  type = string
}

variable "container_image" {
  type = string
  default = "087223743884.dkr.ecr.eu-west-1.amazonaws.com/ssot-consumer:0.0.5"
}

variable "container_cpu_units" {
  type = number
  default = 1024
}

variable "container_memory" {
  type = number
  default = 2048
}


variable "ecr_arn" {
  type = string
}