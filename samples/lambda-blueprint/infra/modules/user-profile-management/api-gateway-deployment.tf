resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.user_profile,

      aws_api_gateway_method.get_profile_by_id,
      aws_api_gateway_integration.get_profile_by_id_integration,

      aws_api_gateway_method.create_profile,
      aws_api_gateway_integration.create_profile_integration,

      aws_api_gateway_method.delete_profile,
      aws_api_gateway_integration.delete_profile_integration

    ]))
  }

  depends_on = [
    aws_api_gateway_resource.user_profile,

    aws_api_gateway_method.get_profile_by_id,
    aws_api_gateway_integration.get_profile_by_id_integration,

    aws_api_gateway_method.create_profile,
    aws_api_gateway_integration.create_profile_integration,

    aws_api_gateway_method.delete_profile,
    aws_api_gateway_integration.delete_profile_integration
  ]
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = "v1"
}



