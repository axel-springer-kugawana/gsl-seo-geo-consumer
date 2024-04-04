resource "aws_secretsmanager_secret" "cm-api-secret" {
  name = "${var.application}-${var.environment}-${var.ssot_name}-cm-api-secret"
}