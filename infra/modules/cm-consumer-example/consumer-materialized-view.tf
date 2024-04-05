locals {
  partition_key = "id"
}

resource "aws_dynamodb_table" "consumer_materialized_view_table" {
  name         = "${var.application}-${var.environment}-matview-example"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = local.partition_key
  attribute {
    name = local.partition_key
    type = "S"
  }


  ttl {
    attribute_name = "expireat"
    enabled        = true
  }

}
