# Optional: the task is meant to be run on demand, a schedule is only created
# when var.schedule_expression is set.
resource "aws_iam_role" "scheduler" {
  count = var.schedule_expression == "" ? 0 : 1
  name  = "${local.name}-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
    ]
  })
}

data "aws_iam_policy_document" "scheduler" {
  count = var.schedule_expression == "" ? 0 : 1

  statement {
    effect  = "Allow"
    actions = ["ecs:RunTask"]
    resources = [
      # RunTask is authorized against the revision-less family arn.
      "${replace(aws_ecs_task_definition.geo_bulk_load.arn, "/:[0-9]+$/", "")}:*"
    ]
    condition {
      test     = "ArnEquals"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.geo_bulk_load.arn]
    }
  }

  statement {
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.task.arn,
      aws_iam_role.task_execution.arn,
    ]
  }
}

resource "aws_iam_policy" "scheduler" {
  count  = var.schedule_expression == "" ? 0 : 1
  name   = "${local.name}-scheduler"
  policy = data.aws_iam_policy_document.scheduler[0].json
}

resource "aws_iam_role_policy_attachment" "scheduler" {
  count      = var.schedule_expression == "" ? 0 : 1
  role       = aws_iam_role.scheduler[0].name
  policy_arn = aws_iam_policy.scheduler[0].arn
}

resource "aws_scheduler_schedule" "geo_bulk_load" {
  count       = var.schedule_expression == "" ? 0 : 1
  name        = local.name
  group_name  = "default"
  description = "Loads the geo parquet export into the ssot database"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = var.schedule_expression
  schedule_expression_timezone = "Europe/Paris"

  target {
    arn      = aws_ecs_cluster.geo_bulk_load.arn
    role_arn = aws_iam_role.scheduler[0].arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.geo_bulk_load.arn
      launch_type         = "FARGATE"
      task_count          = 1

      network_configuration {
        subnets          = data.aws_subnets.application_subnets.ids
        security_groups  = [aws_security_group.task.id]
        assign_public_ip = false
      }
    }

    retry_policy {
      # The task is idempotent, but a load takes long enough that a retry is
      # better triggered by hand after reading the logs.
      maximum_retry_attempts = 0
    }
  }
}
