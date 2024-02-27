locals {
  state_machine_name = "${var.application}-${var.environment}-${var.ssot_name}-get-stow"
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

resource "aws_sfn_state_machine" "list-ssot-sotw-keys-sfn" {
  name     = local.state_machine_name
  role_arn = aws_iam_role.step_function_role.arn
  definition = templatefile("${path.module}/sfn-templates/list-ssot-keys.json.tmpl", {
    list_ssot_keys_function_name = "${module.list_ssot_keys_lambda.function_name}"
    prefix                       = "$.prefix"
    keys_batching_size           = tostring(var.get_state_of_the_world_key_batch_size)
    ssot_name                    = "${var.ssot_name}"
  })
}

data "aws_iam_policy_document" "step_function_policy" {
  statement {
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction",
    ]
    resources = [
      module.list_ssot_keys_lambda.function_arn
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
