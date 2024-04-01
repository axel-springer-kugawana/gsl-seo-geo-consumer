
## user profile resource
resource "aws_api_gateway_resource" "user_profile" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "profiles"
}

resource "aws_api_gateway_resource" "user_profile_by_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.user_profile.id
  path_part   = "{userId}"
}
