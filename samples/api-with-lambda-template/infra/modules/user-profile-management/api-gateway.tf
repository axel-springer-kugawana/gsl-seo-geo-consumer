resource "aws_api_gateway_rest_api" "this" {
  name = "${var.application}-${var.environment}${var.environment_suffix}-api"
  endpoint_configuration {
    types = ["PRIVATE"]
  }

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = "*",
        Action    = "execute-api:Invoke",
        Resource = [
          "execute-api:/*"
        ],
      },
      {
        Effect    = "Deny",
        Principal = "*",
        Action    = "execute-api:Invoke",
        Resource = [
          "execute-api:/*"
        ],
        Condition = {
          "StringNotEquals" = {
            "aws:sourceVpc" = var.central_network_vpc_id_for_private_api_invocation
          }
        }
      }
    ],
  })
}

