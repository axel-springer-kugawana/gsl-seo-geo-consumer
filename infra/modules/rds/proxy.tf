resource "aws_secretsmanager_secret" "rds_proxy_credentials" {
  name = "${var.application}-${var.environment}-${var.ssot_name}-rds_proxy_credentials"
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_proxy_credentials.id
 secret_string = jsonencode({
    "username" = module.aurora_cluster.cluster_master_username
    "password" = module.aurora_cluster.cluster_master_password
  })
}

resource "aws_db_proxy" "rds_proxy" {
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
    description = "RDS Proxy authentication"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.rds_proxy_credentials.arn
  }
}

resource "aws_db_proxy_target" "rds_proxy_target" {
  db_proxy_name         = aws_db_proxy.rds_proxy.name
  db_cluster_identifier = module.aurora_cluster.cluster_id
  target_group_name     = aws_db_proxy_default_target_group.rds_proxy_default_target_group.name
}

resource "aws_db_proxy_default_target_group" "rds_proxy_default_target_group" {
  db_proxy_name = aws_db_proxy.rds_proxy.name
  connection_pool_config {
    max_connections_percent      = var.proxy_max_connections_percent
    max_idle_connections_percent = var.proxy_max_idle_connections_percent
    connection_borrow_timeout    = var.proxy_connection_borrow_timeout
    # session_pinning_filters      = var.proxy_session_pinning_filters
  }
}

resource "aws_security_group" "rds_proxy" {
  name        = "rds_proxy_in${var.suffix}"
  description = "allow rds_proxy_in traffic"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Proxy from VPN"
    from_port       = var.rds_aurora_port
    to_port         = var.rds_aurora_port
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.vpn_access_prefix_list.id] # cidr_blocks = var.env_cidr
  }

  ingress {
    description = "Proxy from VPC"
    from_port   = var.rds_aurora_port
    to_port     = var.rds_aurora_port
    protocol    = "tcp"
    cidr_blocks = var.env_cidr
  }

  ingress {
    description     = "Allow RDS Proxy to connect to RDS cluster"
    security_groups = [aws_security_group.allow_postgres.id]
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}
