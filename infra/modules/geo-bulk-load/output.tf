output "properties" {
  description = "Everything needed to push the image and to run the task by hand"
  value = {
    ecr_repository_url  = aws_ecr_repository.geo_bulk_load.repository_url
    ecr_repository_name = aws_ecr_repository.geo_bulk_load.name
    cluster_name        = aws_ecs_cluster.geo_bulk_load.name
    cluster_arn         = aws_ecs_cluster.geo_bulk_load.arn
    task_definition     = aws_ecs_task_definition.geo_bulk_load.family
    task_definition_arn = aws_ecs_task_definition.geo_bulk_load.arn
    security_group_id   = aws_security_group.task.id
    subnet_ids          = data.aws_subnets.application_subnets.ids
    log_group           = aws_cloudwatch_log_group.geo_bulk_load.name
    secret_arn = aws_secretsmanager_secret.geo_bulk_load.arn
    secret_name = aws_secretsmanager_secret.geo_bulk_load.name
  }
}

output "run_task_command" {
  description = "Ready to paste on demand invocation"
  value = join(" ", [
    "aws ecs run-task",
    "--cluster ${aws_ecs_cluster.geo_bulk_load.name}",
    "--task-definition ${aws_ecs_task_definition.geo_bulk_load.family}",
    "--launch-type FARGATE",
    "--network-configuration 'awsvpcConfiguration={subnets=[${join(",", data.aws_subnets.application_subnets.ids)}],securityGroups=[${aws_security_group.task.id}],assignPublicIp=DISABLED}'",
  ])
}
