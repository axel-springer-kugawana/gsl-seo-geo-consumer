locals {
  state_machine_name = "${var.application}-${var.environment}-get-sotw-sfn"
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
            "aws:SourceAccount" = "${var.account_data.account_id}"
          }
        }
      },
    ]

  })
}



data "aws_iam_policy_document" "ecs_event_rules" {
  statement {
    sid       = "EventBridgeActions"
    effect    = "Allow"
    resources = ["arn:aws:events:${var.account_data.region_name}:${var.account_data.account_id}:rule/StepFunctionsGetEventsForECSTaskRule"]

    actions = [
      "events:DescribeRule",
      "events:PutRule",
      "events:PutTargets"
    ]
  }


  statement {
    sid       = "IAMPassRoleForCloudWatchEvents"
    effect    = "Allow"
    resources = ["arn:aws:iam::*:role/AWS_Events_Invoke_Targets"]
    actions   = ["iam:PassRole"]
  }

}

resource "aws_sfn_state_machine" "get-ssot-sotw-sfn" {
  name     = local.state_machine_name
  role_arn = aws_iam_role.step_function_role.arn
  definition = templatefile("${path.module}/sfn-templates/ssot-consumer-init-from-sotw.json.tmpl", {
    cluster_arn         = "${aws_ecs_cluster.ecs_cluster.arn}"
    task_definition_arn = "${local.task_family_arn}"
    subnets = [
      "${var.account_data.subnets.container_subnet_1}",
      "${var.account_data.subnets.container_subnet_2}",
      "${var.account_data.subnets.container_subnet_3}"
    ]
    security_groups            = ["${aws_security_group.sg_task.id}"]
    get_objects_function_name  = "${module.process_ssot_items_lambda.function_name}"
    inventory_bucket = "${aws_s3_bucket.state_of_world_inventory_bucket.id}"
    output_inventory_file = "$$.Execution.Name"
    source_bucket = "${var.ssot_sotw_bucket.id}"
    prefix = "$.prefix"
    container_name = "${var.application}-${var.environment}-list-bucket-job"
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
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.state_of_world_inventory_bucket.arn

    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
    ]
    resources = [
      "${aws_s3_bucket.state_of_world_inventory_bucket.arn}/*"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction",
    ]
    resources = [
      module.process_ssot_items_lambda.function_arn
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "states:StartExecution",
    ]
    resources = [
      "arn:aws:states:${var.account_data.region_name}:${var.account_data.account_id}:stateMachine:${aws_sfn_state_machine.get-ssot-sotw-sfn.name}"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "states:DescribeExecution", "states:StopExecution"
    ]
    resources = [
      "arn:aws:states:${var.account_data.region_name}:${var.account_data.account_id}:stateMachine:${aws_sfn_state_machine.get-ssot-sotw-sfn.name}/*",
    ]
  }
}

resource "aws_iam_policy" "iam_policy_for_step_function" {
  policy = data.aws_iam_policy_document.step_function_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_step_function_iam_policy_to_iam_role" {
  role       = aws_iam_role.step_function_role.name
  policy_arn = aws_iam_policy.iam_policy_for_step_function.arn
}


resource "aws_iam_policy" "ecs_event_rules" {
  policy = data.aws_iam_policy_document.ecs_event_rules.json
}

resource "aws_iam_role_policy_attachment" "ecs_event_rules_policy_attachment" {
  role       = aws_iam_role.step_function_role.name
  policy_arn = aws_iam_policy.ecs_event_rules.arn
}


