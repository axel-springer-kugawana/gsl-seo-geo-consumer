variable "lambda_function_name" {
  type = string
}

variable "lambda_role_arn" {
  type = string
}

variable "lambda_handler" {
  type = string
}

variable "env_variables" {
  type        = map(string)
  description = "Environment variables injected into the lambda function"
}

variable "timeout" {
  type    = string
  default = 30
}

variable "memory_size" {
  type    = string
  default = 128
}

variable "runtime" {
    type   = string
    default = "nodejs20.x"
}

variable "lambda_dist_file" {
    type   = string
}

variable "cloudwatch_log_retention" {
  type        = number
  default     = 7
  description = "Number of days for log retention"
}

variable "is_lambda_vpc" {
  type    = bool
  default = false
}

variable "enable_secrets_manager_extension" {
  type    = bool
  default = false
}

# variable "kinesis_firehose_arn" {
#   description = "Kinesis ARN for log stream"
#   type        = string
# }

# variable "loggroup_role_arn" {
#   description = "Role ARN for loggroup (should be able to write to kinesis firehose)"
#   type        = string
# }