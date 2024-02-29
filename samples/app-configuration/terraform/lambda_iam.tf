
data "aws_iam_policy_document" "allow_lambda" {
  statement {
    sid     = "AllowLambda"
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "allow_lambda" {
  name               = "${var.service_name}_allow_lambda"
  assume_role_policy = data.aws_iam_policy_document.allow_lambda.json
}

data "aws_iam_policy_document" "lambda_deps" {
  statement {
    resources = [
      "${aws_cloudwatch_log_group.tsfunc.arn}:*",
      "${aws_cloudwatch_log_group.csfunc.arn}:*",
    ]
    effect  = "Allow"
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
  }
  statement {
    resources = ["${module.appconfig_freeform.application_arn}/*"]
    effect    = "Allow"
    actions = [
      "appconfig:StartConfigurationSession",
      "appconfig:GetLatestConfiguration",
    ]
  }
  statement {
    resources = ["arn:aws:ssm:*:*:parameter/*"]
    effect    = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
  }
}

resource "aws_iam_policy" "lambda_deps" {
  name   = "${var.service_name}_lambda_deps"
  policy = data.aws_iam_policy_document.lambda_deps.json
}

resource "aws_iam_role_policy_attachment" "allow_lambda" {
  role       = aws_iam_role.allow_lambda.name
  policy_arn = aws_iam_policy.lambda_deps.arn
}
