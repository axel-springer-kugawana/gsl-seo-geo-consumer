resource "random_password" "rds_aurora_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "postgres_credentials" {
  name                    = "${var.application}-postgres_credentials_secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "postgres_credentials" {
  secret_id = aws_secretsmanager_secret.postgres_credentials.id
  secret_string = jsonencode({
    # "HostWriter"           = module.aurora_cluster.cluster_endpoint
    # "HostReader"           = module.aurora_cluster.cluster_reader_endpoint
    # "Username"             = module.aurora_cluster.cluster_master_username
    # "Password"             = module.aurora_cluster.cluster_master_password
    # "Port"                 = module.aurora_cluster.cluster_port
    # "Database"             = module.aurora_cluster.cluster_database_name
    # "CommandTimeout"       = 2000,
    # "Timeout"              = 1024
    # "KeepAlive"            = 2000
    username  = module.aurora_cluster.cluster_master_username
    password  = module.aurora_cluster.cluster_master_password
    host      = module.aurora_cluster.cluster_endpoint
    port      = module.aurora_cluster.cluster_port
    proxyhost = "rds.${var.application}-${var.environment}.${data.aws_route53_zone.main.name}"
  })
}
