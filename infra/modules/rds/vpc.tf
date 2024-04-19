data "aws_ec2_managed_prefix_list" "vpn_access_prefix_list" {
  name = "internal.gsl.aws.vpc.central-network-svpc-central-v5"
}

resource "aws_security_group" "allow_postgres" {
  name        = "allow_traffic_postgres${var.suffix}"
  description = "allow postgres traffic"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Postgres from VPC"
    from_port       = var.rds_aurora_port
    to_port         = var.rds_aurora_port
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.vpn_access_prefix_list.id] # cidr_blocks = var.env_cidr
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_lambda_consumer_sg_to_rds2" {
  description                  = "allow lambda_consumer_sg_to_rds"
  security_group_id            = var.rds_sg_id                                   #"sg-09f4cd64832e4faac"
  referenced_security_group_id = module.process_cm_connector_events_lambda.sg_id #sg-0b9b49c4a55d47295" #data.aws_security_group.lambda_consumer_sg.id
  from_port                    = 5432
  ip_protocol                  = "tcp"
  to_port                      = 5432
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
