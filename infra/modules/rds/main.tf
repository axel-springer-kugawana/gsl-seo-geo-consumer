module "aurora_cluster" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "9.3.1"

  name   = "${var.rds_aurora_name}${var.suffix}"
  engine = "aurora-postgresql"
  # engine_mode    = var.rds_engine_mode
  # engine_version = var.rds_aurora_postgres_version

  engine_mode    = "provisioned"
  instance_class = "db.serverless"
  engine_version = "15.2"

  vpc_id = var.vpc_id

  subnets              = var.subnets
  db_subnet_group_name = "main"

  vpc_security_group_ids = [aws_security_group.allow_postgres.id]
  create_security_group  = false

  apply_immediately         = true
  final_snapshot_identifier = "${var.rds_aurora_name}${var.suffix}-final-snapshot"

  master_username = var.rds_aurora_username
  master_password = random_password.rds_aurora_password.result
  # database_name          = var.rds_aurora_database
  database_name = ""
  port          = var.rds_aurora_port

  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  storage_encrypted               = true
  performance_insights_enabled    = false

  scaling_configuration = {
    auto_pause               = true
    min_capacity             = var.rds_acu_min
    max_capacity             = var.rds_acu_max
    seconds_until_auto_pause = 300
    timeout_action           = "ForceApplyCapacityChange"
  }

}
