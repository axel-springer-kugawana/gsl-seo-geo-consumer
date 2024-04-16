output "rds_aurora_username" {
  value = var.rds_aurora_username
}


output "rds_cluster_writer_endpoint" {
  value = module.aurora_cluster.cluster_endpoint
}

output "rds_cluster_port" {
  value = module.aurora_cluster.cluster_port
}

