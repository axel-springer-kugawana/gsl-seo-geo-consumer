locals {
  state_machine_name = "${var.application}-${var.environment}-job-runner-sfn"
  task_family_arn    = replace(aws_ecs_task_definition.ecs_task_definition.arn, "/:\\d+$/", "")
}


resource "aws_iam_role" "step_function_role" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "states.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = "${data.aws_caller_identity.current.account_id}"
          }
        }
      },
    ]
  })
}


resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = local.state_machine_name
  role_arn = aws_iam_role.step_function_role.arn
  definition = templatefile("${path.module}/files/run-job.json.tmpl", {
    cluster_arn         = "${aws_ecs_cluster.ecs_cluster.arn}"
    task_definition_arn = "${local.task_family_arn}"
    subnets = [
      "${data.aws_ssm_parameter.container_subnet_1.value}",
      "${data.aws_ssm_parameter.container_subnet_2.value}",
      "${data.aws_ssm_parameter.container_subnet_3.value}"
    ]
    security_groups = ["${aws_security_group.sg_task_runner.id}"]
  })
}



data "aws_iam_policy_document" "step_function_policy" {
  statement {
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.ecs_task_execution_role.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["ecs:RunTask"]
    resources = [local.task_family_arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["ecs:StopTask", "ecs:DescribeTasks"]
    resources = ["*"]
    condition {
      test     = "ArnEquals"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.ecs_cluster.arn]
    }
  }
  statement {
    actions = [
      "events:DescribeRule",
      "events:PutRule",
      "events:PutTargets"
    ]
    effect    = "Allow"
    resources = ["arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/StepFunctionsGetEventsForECSTaskRule"]
  }
}


resource "aws_iam_policy" "iam_policy_for_step_function" {
  policy = data.aws_iam_policy_document.step_function_policy.json
}


resource "aws_iam_role_policy_attachment" "attach_step_function_iam_policy_to_iam_role" {
  role       = aws_iam_role.step_function_role.name
  policy_arn = aws_iam_policy.iam_policy_for_step_function.arn
}
