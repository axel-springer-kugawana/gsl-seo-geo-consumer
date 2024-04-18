output "rds_aurora_username" {
  value = var.rds_aurora_username
}

//https://github.com/search?q=repo%3Acloudposse%2Fterraform-aws-rds-cluster%20is_regional_cluster%20&type=code
output "arn" {
  # value       = module.aurora_cluster.cluster_endpoint
  # value       = local.is_regional_cluster ? join("", module.aurora_cluster.aws_rds_cluster.primary[*].arn) : join("", module.aurora_cluster.aws_rds_cluster.secondary[*].arn)
  value       = join("", module.aurora_cluster.aws_rds_cluster.primary[*].arn)
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
