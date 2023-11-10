resource "aws_api_gateway_resource" "ssot_entity_id" {
  rest_api_id = aws_api_gateway_rest_api.private_api.id
  parent_id   = aws_api_gateway_resource.ssot_entity.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "get_method" {
  rest_api_id      = aws_api_gateway_rest_api.private_api.id
  resource_id      = aws_api_gateway_resource.ssot_entity_id.id
  http_method      = local.http_methods.GET
  api_key_required = true 
  authorization    = "NONE"

  request_parameters = {
    "method.request.header.UserAgent" = true
  }
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.private_api.id
  resource_id             = aws_api_gateway_resource.ssot_entity_id.id
  http_method             = aws_api_gateway_method.get_method.http_method
  integration_http_method = local.http_methods.POST
  type                    = "AWS_PROXY"
  uri                     = module.get_ssot_item_lambda.function_invoke_arn

}

resource "aws_api_gateway_integration_response" "lambda_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.private_api.id
  resource_id = aws_api_gateway_resource.ssot_entity_id.id
  http_method = aws_api_gateway_method.get_method.http_method
  status_code = aws_api_gateway_method_response.method_response.status_code

  response_templates = {
    "application/json" = ""
  }

  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method_response" "method_response" {
  rest_api_id = aws_api_gateway_rest_api.private_api.id
  resource_id = aws_api_gateway_resource.ssot_entity_id.id
  http_method = aws_api_gateway_method.get_method.http_method
  status_code = local.http_statuscodes.OK

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "method_response_no_content" {
  rest_api_id = aws_api_gateway_rest_api.private_api.id
  resource_id = aws_api_gateway_resource.ssot_entity_id.id
  http_method = aws_api_gateway_method.get_method.http_method
  status_code = local.http_statuscodes.NoContent

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}