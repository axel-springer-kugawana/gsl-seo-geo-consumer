resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${var.application}-${var.environment}-cluster"
}

resource "aws_ecs_task_definition" "ecs_task_definition" {
  family = "${var.application}-${var.environment}-task"
  container_definitions = jsonencode([
    {
      name   = "${var.application}-${var.environment}-job"
      image  = var.container_image
      cpu    = var.container_cpu_units
      memory = var.container_memory
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"  = aws_cloudwatch_log_group.ecs_task_job_log_group.name
          "awslogs-region" = data.aws_region.current.name
          "awslogs-create-group" : "true"
          "awslogs-stream-prefix" = "ecs_task_job_log_group"
        }
      }
    }
  ])
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu_units
  memory                   = var.container_memory
  network_mode             = "awsvpc"
}


data "aws_iam_policy_document" "ecs_task_execution_assume_role_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role_policy.json
}


data "aws_iam_policy_document" "ecs_task_execution_policy_statements" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
  statement {
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    effect = "Allow"
    ## TODO : constrain the resource
    resources = ["*"]
  }
}

resource "aws_iam_policy" "iam_policy_for_ecs_task" {
  policy = data.aws_iam_policy_document.ecs_task_execution_policy_statements.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy_attach" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.iam_policy_for_ecs_task.arn
}


resource "aws_cloudwatch_log_group" "ecs_task_job_log_group" {
  name              = "/ecs/${var.application}-${var.environment}-ecs_task_job_log_group"
  retention_in_days = 3
}

resource "aws_security_group" "sg_task_runner" {
  name        = "ecs task job runner sg"
  description = "sg to assign to ecs task job runner network configuration"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}
