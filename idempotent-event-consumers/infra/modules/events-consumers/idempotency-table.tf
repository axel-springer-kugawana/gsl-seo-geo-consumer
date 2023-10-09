locals {
  idempotency_table_partition_key = "id"
}

resource "aws_dynamodb_table" "idempotency_table" {
    name         = "${var.application}-${var.environment}-classified-censored-consumer-idempotency-table"
    billing_mode = "PAY_PER_REQUEST"
    hash_key     =  local.idempotency_table_partition_key
    attribute {
        name = local.idempotency_table_partition_key
        type = "S"
    }
    ttl {
        attribute_name = "expiration"
        enabled        = true
    }
}