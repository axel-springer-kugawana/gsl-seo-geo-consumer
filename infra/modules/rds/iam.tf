data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "rds_proxy_iam_role" {
  name               = "rds-proxy-role${var.suffix}"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "rds_proxy_policy_document" {
  statement {
    sid = "AllowProxyToGetDbCredsFromSecretsManager"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [
      module.aurora_cluster.cluster_arn
    ]
  }

  statement {
    sid = "AllowProxyToDecryptDbCredsFromSecretsManager"

    actions = [
      "kms:Decrypt"
    ]

    resources = [
      "*"
    ]

    condition {
      test     = "StringEquals"
      values   = ["secretsmanager.eu-west-1.amazonaws.com"]
      variable = "kms:ViaService"
    }
  }
}

resource "aws_iam_policy" "rds_proxy_iam_policy" {
  name   = "rds-proxy-policy${var.suffix}"
  policy = data.aws_iam_policy_document.rds_proxy_policy_document.json
}

resource "aws_iam_role_policy_attachment" "rds_proxy_iam_attach" {
  policy_arn = aws_iam_policy.rds_proxy_iam_policy.arn
  role       = aws_iam_role.rds_proxy_iam_role.name
}
