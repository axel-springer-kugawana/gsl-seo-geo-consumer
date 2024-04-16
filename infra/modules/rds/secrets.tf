resource "random_password" "rds_aurora_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "postgres_credentials" {
  name                    = "${var.environment}/${var.application}/postgres_credentials${var.suffix}"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "postgres_credentials" {
  secret_id = aws_secretsmanager_secret.postgres_credentials.id
  secret_string = jsonencode({
    "rds_aurora_username" = var.rds_aurora_username
    "rds_aurora_password" = random_password.rds_aurora_password.result
    "rds_aurora_database" = var.rds_aurora_database
    "rds_aurora_port"     = var.rds_aurora_port
    "rds_aurora_engine"   = "postgres"
  })
}

resource "aws_secretsmanager_secret" "postgres_uri" {
  name                    = "${var.environment}/${var.application}/postgres_uri${var.suffix}"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "postgres_uri" {
  secret_id     = aws_secretsmanager_secret.postgres_credentials.id
  secret_string = "Host = ${module.aurora_cluster.cluster_endpoint}:${var.rds_aurora_port}; Username = ${var.rds_aurora_username}; Password = ${random_password.rds_aurora_password.result}; Database = ${var.rds_aurora_database}; CommandTimeout=2000; Timeout=1024; KeepAlive=2000"
}
