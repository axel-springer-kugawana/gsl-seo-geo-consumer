resource "random_password" "rds_aurora_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "postgres_credentials_writer" {
  name                    = "${var.application}-postgres_credentials_writer_secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "postgres_credentials_writer" {
  secret_id = aws_secretsmanager_secret.postgres_credentials_writer.id
  secret_string = jsonencode({
    "Host" = aws_db_proxy.rds_proxy.endpoint
    #module.aurora_cluster.cluster_endpoint
    "Username"       = module.aurora_cluster.cluster_master_username
    "Password"       = module.aurora_cluster.cluster_master_password
    "Port"           = module.aurora_cluster.cluster_port
    "Database"       = module.aurora_cluster.cluster_database_name
    "CommandTimeout" = 2000,
    "Timeout"        = 1024
    "KeepAlive"      = 2000
  })
}
