# data "aws_security_group" "lambda_consumer_sg" {
#   name = "${var.application}-${var.environment}-process-cm-connector-events-vpc-sg"
#   #   name = "cm-sample-dev-process-cm-connector-events-vpc-sg"
# }


# data "aws_elb_service_account" "main" {}

# data "aws_ec2_managed_prefix_lists" "this" {
#   filter {
#     name   = "prefix-list-name"
#     values = formatlist("internal.aviv.aws.vpc.%s-%s", var.authorized_accounts, var.aws_environment)
#   }
# }

# data "aws_ec2_managed_prefix_lists" "legacy_account_prefix_lists" {
#   filter {
#     name   = "prefix-list-name"
#     values = formatlist("%s-%s", var.authorized_legacy_accounts, var.aws_environment)
#   }
# }

