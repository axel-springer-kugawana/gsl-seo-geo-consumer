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
    description = "Authentication credentials for rds proxy"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.postgres_credentials_writer.arn
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
    description     = "allow lambda_consumer_sg_to_proxy"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_group_id        = aws_security_group.allow_postgres.id
    source_security_group_id = aws_security_group.rds_proxy.id
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