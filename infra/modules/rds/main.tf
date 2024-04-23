module "aurora_cluster" {
  # https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/v9.3.1/examples/serverless/main.tf
  source                          = "terraform-aws-modules/rds-aurora/aws"
  version                         = "9.3.1"
  name                            = "${var.rds_aurora_name}${var.suffix}"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "16.1"
  vpc_id                          = var.vpc_id
  subnets                         = var.subnets
  db_subnet_group_name            = "main"
  vpc_security_group_ids          = [aws_security_group.allow_postgres.id]
  create_security_group           = false
  apply_immediately               = true
  final_snapshot_identifier       = "${var.rds_aurora_name}${var.suffix}-final-snapshot"
  master_username                 = var.rds_aurora_username
  master_password                 = random_password.rds_aurora_password.result
  database_name                   = var.rds_aurora_database
  port                            = 5432
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  storage_encrypted               = true
  skip_final_snapshot             = true
  rds_enable_proxy                = true
  serverlessv2_scaling_configuration = {
    min_capacity = var.rds_acu_min
    max_capacity = var.rds_acu_max
  }
  instance_class = "db.serverless"
  instances = {
    one = {}
    two = {}
  }
}
