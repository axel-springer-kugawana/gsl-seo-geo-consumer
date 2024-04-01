resource "aws_dynamodb_table" "user_profile_table" {
  name         = "${var.application}-${var.environment}${var.environment_suffix}-user-profile"
  billing_mode = "PAY_PER_REQUEST"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

}


