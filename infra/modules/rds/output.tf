output "rds_aurora_username" {
  value = var.rds_aurora_username
}
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/v9.3.1/examples/serverless/outputs.tf
output "arn" {
  value       = module.aurora_cluster.cluster_arn
  description = "Amazon Resource Name (ARN) of the cluster"
}

# output "arn" {
#   value       = local.is_regional_cluster ? join("", aws_rds_cluster.primary[*].arn) : join("", aws_rds_cluster.secondary[*].arn)
#   description = "Amazon Resource Name (ARN) of the cluster"
# }
output "rds_cluster_port" {
  value = module.aurora_cluster.cluster_port
}

output "aws_secretsmanager_secret_arn" {
  value = aws_secretsmanager_secret.postgres_uri.arn
}
