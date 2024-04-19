output "rds_aurora_username" {
  value = var.rds_aurora_username
}
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/v9.3.1/examples/serverless/outputs.tf
output "arn" {
  value       = module.aurora_cluster.cluster_arn
  description = "Amazon Resource Name (ARN) of the cluster"
}

output "rds_cluster_port" {
  value = module.aurora_cluster.cluster_port
}

output "secret_arn" {
  value = aws_secretsmanager_secret.postgres_credentials_writer.arn
}
output "secret_name" {
  value = aws_secretsmanager_secret.postgres_credentials_writer.name
}

#testfu
output "sg_id" {
  description = "The ID of the security group"
  value       = aws_security_group.allow_postgres.id
}
