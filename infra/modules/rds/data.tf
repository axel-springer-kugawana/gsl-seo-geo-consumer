data "aws_security_group" "lambda_consumer_sg" {

  filter {
    name   = "tag:fms-policy-name"
    values = ["${var.application}-${var.environment}-process-cm-connector-events-vpc-sg"]
  }
}
