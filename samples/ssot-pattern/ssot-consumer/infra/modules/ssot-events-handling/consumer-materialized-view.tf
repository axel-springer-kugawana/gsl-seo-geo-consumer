locals {
  partition_key = "id"
}

resource "aws_dynamodb_table" "consumer_materialized_view_table" {
    name         = "${var.application}-${var.environment}-materialized-view-example"
    billing_mode = "PAY_PER_REQUEST"
    hash_key     =  local.partition_key
    attribute {
        name = local.partition_key
        type = "S"
    }
    
}