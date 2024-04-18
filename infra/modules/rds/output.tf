output "rds_aurora_username" {
  value = var.rds_aurora_username
}


output "rds_cluster_writer_endpoint" {
  value = module.aurora_cluster.cluster_endpoint.arn
}

output "rds_cluster_port" {
  value = module.aurora_cluster.cluster_port
}

output "aws_secretsmanager_secret_arn" {
  value = aws_secretsmanager_secret.postgres_uri.arn
}
