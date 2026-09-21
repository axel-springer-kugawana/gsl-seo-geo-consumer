# variable "composant" {
#   type        = string
#   description = "Capability name (bff, api, web ... )."
# }
variable "aws_account_name" {
  type        = string
  description = "AWS account name or workspace."
}
# variable "organisation" {
#   type        = string
#   default     = "aviv"
#   description = "Organisation name."
# }
# variable "aws_region" {
#   type        = string
#   default     = "eu-west-1"
#   description = "AWS region name."
#   validation {
#     condition     = var.aws_region == "eu-west-1"
#     error_message = "All resources have to be deploy on eu-west-1."
#   }
# }

# variable "owner" {
#   type        = string
#   description = "Team name."
# }

# variable "unified_routing_cloudfront_arns" {
#   description = "list of unified routing cloudfront arns"
#   type        = list(string)
#   default     = []
# }

# variable "legacy_aws_account_id" {
#   type        = string
#   description = "Legacy AWS account id."
# }
# variable "legacy_aws_account_name" {
#   type        = string
#   description = "Legacy AWS account name."
# }