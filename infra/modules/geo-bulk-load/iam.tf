resource "aws_iam_role" "task_execution" {
  name = "${local.name}-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task" {
  name = "${local.name}-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
}

data "aws_iam_policy_document" "task" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
    ]
    resources = [
      "${var.geo_bucket.arn}/*"
    ]
  }

  # Resolving the latest snapshot and expanding the parquet globs both list.
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      var.geo_bucket.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      aws_secretsmanager_secret.geo_bulk_load.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.geo_bulk_load.arn}:*"
    ]
  }

  # Needed to decrypt the parquet export when the source bucket uses SSE-KMS.
  # The key's resource policy (owned by the producing account) must also grant this role kms:Decrypt.
  dynamic "statement" {
    for_each = var.geo_bucket_kms_key_arn != "" ? [1] : []
    content {
      effect = "Allow"
      actions = [
        "kms:Decrypt",
        "kms:DescribeKey",
      ]
      resources = [
        var.geo_bucket_kms_key_arn
      ]
    }
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      var.geo_dynamodb_table.arn
    ]
  }
}

resource "aws_iam_policy" "task" {
  name   = "${local.name}-task"
  policy = data.aws_iam_policy_document.task.json
}

resource "aws_iam_role_policy_attachment" "task" {
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task.arn
}
