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
  name               = "sync-bucket-lister"
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
    effect = "Allow"
    actions = [
      "s3:PutObject",
    ]
    resources = [
      "${aws_s3_bucket.state_of_world_inventory_bucket.arn}/*"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      "${var.ssot_sotw_bucket.arn}"
    ]
  }
  statement {
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    effect    = "Allow"
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


