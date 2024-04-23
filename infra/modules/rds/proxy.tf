resource "aws_db_proxy" "rds_proxy" {
  count                  = var.rds_enable_proxy ? 1 : 0
  name                   = "${var.application}-proxy-${var.environment}"
  debug_logging          = true
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = false
  role_arn               = aws_iam_role.rds_proxy_iam_role.arn
  vpc_security_group_ids = [aws_security_group.allow_postgres.id]
  vpc_subnet_ids         = var.subnets
  auth {
    auth_scheme = "SECRETS"
    description = "Authentication credentials for rds proxy"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.postgres_credentials_writer.arn
  }
}
