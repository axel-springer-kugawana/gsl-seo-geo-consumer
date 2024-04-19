data "aws_security_group" "lambda_consumer_sg" {
  tags = {
    Name = "${var.application}-${var.environment}-process-cm-connector-events-vpc-sg"
  }
}
