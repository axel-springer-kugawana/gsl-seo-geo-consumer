resource "random_password" "rds_aurora_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "postgres_credentials_writer" {
  name                    = "${var.application}-postgres_credentials-secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "postgres_credentials_writer" {
  secret_id = aws_secretsmanager_secret.postgres_credentials_writer.id
  secret_string = jsonencode({
    "Host"           = module.aurora_cluster.cluster_endpoint
    "Username"       = var.rds_aurora_username
    "Password"       = random_password.rds_aurora_password.result
    "Port"           = var.rds_aurora_port
    "Database"       = var.rds_aurora_database
    "CommandTimeout" = 2000,
    "Timeout"        = 1024
    "KeepAlive"      = 2000
  })
}
