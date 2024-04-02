resource "aws_api_gateway_method" "get_profile_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.user_profile_by_id.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.userId" = true
  }
}

resource "aws_api_gateway_method_response" "get_profile_by_id_response_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.user_profile_by_id.id
  http_method = aws_api_gateway_method.get_profile_by_id.http_method
  status_code = "200"

  depends_on = [aws_api_gateway_method.get_profile_by_id]
}

resource "aws_api_gateway_integration" "get_profile_by_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.user_profile_by_id.id
  http_method             = aws_api_gateway_method.get_profile_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.get_profile_by_id_lambda.function_invoke_arn
}

resource "aws_lambda_permission" "get_profile_by_id_apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.get_profile_by_id_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.this.id}/*/${aws_api_gateway_method.get_profile_by_id.http_method}${aws_api_gateway_resource.user_profile_by_id.path}"
}
