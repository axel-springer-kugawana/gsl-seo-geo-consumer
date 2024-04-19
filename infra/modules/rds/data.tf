data "aws_security_group" "lambda_consumer_sg" {
  #   name = "${var.application}-${var.environment}-process-cm-connector-events-vpc-sg"
  name = "cm-sample-dev-process-cm-connector-events-vpc-sg"
}
