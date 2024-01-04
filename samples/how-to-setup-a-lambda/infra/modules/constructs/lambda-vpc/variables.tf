variable "lambda_function_name" {
  type = string
  description = "(Required) Unique name for your Lambda Function."
  nullable = false
}

variable "lambda_dist_dir" {
  type        = string
  description = "Path of the function's code."
  nullable = false
}

variable "lambda_handler" {
  type        = string
  description = "(Optional) Function entrypoint in your code."
}

variable "env_variables" {
  type        = map(string)
  description = "(Optional) Map of environment variables that are accessible from the function code during execution. If provided at least one key must be present."
  default     = {}
}

variable "runtime" {
  type        = string
  description = "(Optional) Identifier of the function's runtime, See https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime for valid values."
}

variable "memory_size" {
  type        = number
  description = "(Optional) Amount of memory in MB your Lambda Function can use at runtime. Defaults to 128. See https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html."
  default     = 128
}

variable "lambda_timeout" {
  type        = number
  description = "(Optional) Amount of time your Lambda Function has to run in seconds. Defaults to 3. See https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html."
  default     = 3
}

variable "lambda_role_arn" {
  type        = string
  description = "(Required) Amazon Resource Name (ARN) of the function's execution role. The role provides the function's identity and access to AWS services and resources."
  nullable = false
}

variable "cloudwatch_log_retention" {
  type        = number
  description = "(Optional) Specifies the number of days you want to retain log events in the specified log group. Possible values are: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653, and 0. If you select 0, the events in the log group are always retained and never expire."
  default     = 7
}

variable "vpc_id" {
  type        = string
  description = "(Required) Id of the VPC that the desired security group belongs to."
  nullable = false
}

variable "subnet_ids" {
  type        = set(string)
  description = "(Required) List of subnet IDs associated with the Lambda function."
  nullable = false
}