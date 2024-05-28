output "rds_aurora_username" {
  value = var.rds_aurora_username
}
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/v9.3.1/examples/serverless/outputs.tf
output "arn" {
  value       = module.aurora_cluster.cluster_arn
  description = "Amazon Resource Name (ARN) of the cluster"
}

output "proxy_arn" {
  value       = aws_db_proxy.rds_proxy.arn
  description = "Amazon Resource Name (ARN) of the cluster arn "
}

output "rds_cluster_port" {
  value = module.aurora_cluster.cluster_port
}
output "secret_name" {
  value = aws_secretsmanager_secret.postgres_credentials.name
}

output "sg_id" {
  description = "The ID of the security group"
  value       = aws_security_group.allow_postgres.id
}

output "properties" {
  value = {
    name              = module.aurora_cluster.cluster_database_name
    cluster_endpoint  = module.aurora_cluster.cluster_endpoint
    security_group_id = aws_security_group.allow_postgres.id
    secret_name       = aws_secretsmanager_secret.postgres_credentials.name
  }
}

