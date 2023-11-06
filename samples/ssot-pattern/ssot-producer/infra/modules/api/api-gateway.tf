########## private api gateway ###############
locals {
  http_statuscodes = {
    OK       = "200"
    NoContent = "204"
  }
  http_methods = {
    GET  = "GET"
    POST = "POST"
  }

  log_retention_in_days = 7
}

resource "aws_api_gateway_rest_api" "private_api" {
  name        = "${var.application}-${var.environment}-ssot-api"
  description = "Private REST API Gateway to get ssot entities"
  endpoint_configuration {
    types = ["PRIVATE"]
  }

#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect    = "Allow",
#         Principal = "*",
#         Action    = "execute-api:Invoke",
#         Resource = [
#           "execute-api:/*"
#         ],
#       },
#       {
#         Effect    = "Deny",
#         Principal = "*",
#         Action    = "execute-api:Invoke",
#         Resource  = [
#           "execute-api:/*"
#         ],
#         Condition = {
#           "StringNotEquals" = {
#             "aws:sourceVpc" = "vpc-01b88fada1e797866" # VPC ID of Central Network where the VPC Endpoint resides
#           }
#         }
#       }
#     ],
#   })
}

resource "aws_api_gateway_resource" "ssot_entity" {
  rest_api_id = aws_api_gateway_rest_api.private_api.id
  parent_id   = aws_api_gateway_rest_api.private_api.root_resource_id
  path_part   = "ssot-entity"
}

resource "aws_lambda_permission" "apigw_invoke_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.get_ssot_item_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${aws_api_gateway_rest_api.private_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [aws_api_gateway_integration.lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.private_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.ssot_entity,
      aws_api_gateway_resource.ssot_entity_id,
      aws_api_gateway_method.get_method,
      aws_api_gateway_integration.lambda_integration,
      aws_api_gateway_integration_response.lambda_integration_response,
      aws_api_gateway_method_response.method_response
      ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "apigw_log_group" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.private_api.name}"
  retention_in_days = local.log_retention_in_days
}

resource "aws_api_gateway_stage" "ssot_api" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.private_api.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw_log_group.arn
    format = "$context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] \"$context.httpMethod $context.resourcePath $context.protocol\" $context.status $context.responseLength $context.requestId"
  }
}