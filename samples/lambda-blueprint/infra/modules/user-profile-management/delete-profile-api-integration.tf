resource "aws_api_gateway_method" "delete_profile" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.user_profile_by_id.id
  http_method   = "DELETE"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.userId" = true
  }
}

resource "aws_api_gateway_method_response" "delete_profile_response_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.user_profile_by_id.id
  http_method = aws_api_gateway_method.delete_profile.http_method
  status_code = "200"

  depends_on = [aws_api_gateway_method.delete_profile]
}

resource "aws_api_gateway_integration" "delete_profile_integration" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.user_profile_by_id.id
  http_method             = aws_api_gateway_method.delete_profile.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.delete_profile_lambda.function_invoke_arn
}

resource "aws_lambda_permission" "delete_profile_apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.delete_profile_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.this.id}/*/${aws_api_gateway_method.delete_profile.http_method}${aws_api_gateway_resource.user_profile_by_id.path}"
}
