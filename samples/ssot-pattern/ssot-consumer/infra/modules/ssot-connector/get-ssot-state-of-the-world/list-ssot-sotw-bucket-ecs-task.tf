resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${var.application}-${var.environment}-cluster"
}

resource "aws_ecs_task_definition" "ecs_task_definition" {
  family = "${var.application}-${var.environment}-list-bucket-task"
  container_definitions = jsonencode([
    {
      name      = "${var.application}-${var.environment}-list-bucket-job"
      essential = true
      image     = var.list_bucket_task.container_image
      cpu       = var.list_bucket_task.container_cpu_units
      memory    = var.list_bucket_task.container_memory
      environment = []
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"  = aws_cloudwatch_log_group.ecs_task_job_log_group.name
          "awslogs-region" = var.account_data.region_name
          "awslogs-create-group" : "true"
          "awslogs-stream-prefix" = "ecs_task_job_log_group"
        }
      }
    }
  ])

  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.list_bucket_task.container_cpu_units
  memory                   = var.list_bucket_task.container_memory
  network_mode             = "awsvpc"

}


resource "aws_security_group" "sg_task" {
  name        = "${var.application}-${var.environment}-list-ssot-sotw-task-sg"
  description = "sg to assign to ecs task job runner network configuration"
  vpc_id      = var.account_data.vpc_id
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}


resource "aws_cloudwatch_log_group" "ecs_task_job_log_group" {
  name              = "/ecs/${var.application}-${var.environment}-ecs_task_job_log_group"
  retention_in_days = 3
}

