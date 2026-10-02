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

  # GSI hash key must be declared as an attribute (only when the GSI is created)
  dynamic "attribute" {
    for_each = var.gsi_attribute_name != "" ? [var.gsi_attribute_name] : []
    content {
      name = attribute.value
      type = "S"
    }
  }

  ttl {
    attribute_name = "expireat"
    enabled        = true
  }
  # Only create the GSI if gsi_attribute_name is not empty
  dynamic "global_secondary_index" {
    for_each = var.gsi_attribute_name != "" ? [var.gsi_attribute_name] : []
    content {
      name            = "${global_secondary_index.value}-index"
      projection_type = "ALL"
      key_schema {
        attribute_name = global_secondary_index.value
        key_type       = "HASH"
      }
      # Optional GSI range key (must be an already declared attribute, e.g. the table range_key)
      dynamic "key_schema" {
        for_each = var.gsi_range_key != "" ? [var.gsi_range_key] : []
        content {
          attribute_name = key_schema.value
          key_type       = "RANGE"
        }
      }
    }
  }
}
