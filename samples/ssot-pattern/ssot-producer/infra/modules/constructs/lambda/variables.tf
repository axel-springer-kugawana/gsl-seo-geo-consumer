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

variable "lambda_dist_dir" {
    type   = string
}

variable "cloudwatch_log_retention" {
  type        = number
  default     = 7
  description = "Number of days for log retention"
}

