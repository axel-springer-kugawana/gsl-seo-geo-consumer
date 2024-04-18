data "aws_secretsmanager_secret" "by-name" {
  name = "${var.application}-${var.environment}-${var.ssot_name}-postgres_writer-secret"
}
