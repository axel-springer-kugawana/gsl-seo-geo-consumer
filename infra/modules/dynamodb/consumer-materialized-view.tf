resource "aws_dynamodb_table" "consumer_materialized_view_table" {
  name         = "${var.application}"
  billing_mode = "PAY_PER_REQUEST"
  range_key    = var.range_key

  hash_key     = var.partition_key
  attribute {
    name = var.partition_key
    type = "S"
  }

  attribute {
    name = var.range_key
    type = "S"
  }

  ttl {
    attribute_name = "expireat"
    enabled        = true
  }
}
