data "aws_ec2_managed_prefix_list" "vpn_access_prefix_list" {
  name = "internal.gsl.aws.vpc.central-network-svpc-central-v5"
}

resource "aws_security_group" "allow_postgres" {
  name        = "allow_traffic_postgres${var.suffix}"
  description = "allow postgres traffic"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Postgres from VPN"
    from_port       = var.rds_aurora_port
    to_port         = var.rds_aurora_port
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.vpn_access_prefix_list_test.id] # cidr_blocks = var.env_cidr
  }

  ingress {
    description = "Postgres from VPC"
    from_port   = var.rds_aurora_port
    to_port     = var.rds_aurora_port
    protocol    = "tcp"
    cidr_blocks = var.env_cidr
  }

  # ingress {
  #   description     = "allow lambda_consumer_sg_to_rds"
  #   security_groups = ["sg-0b9b49c4a55d47295"]
  #   from_port       = 5432
  #   to_port         = 5432
  #   protocol        = "tcp"
  # }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

# Needs to be done in the bastion modules
#resource "aws_security_group_rule" "bastion_db_access" {
#type                     = "ingress"
#from_port                = var.rds_aurora_port
#to_port                  = var.rds_aurora_port
#protocol                 = "tcp"
#source_security_group_id = var.bastion_security_group_id
#security_group_id        = aws_security_group.allow_postgres.id
#}
