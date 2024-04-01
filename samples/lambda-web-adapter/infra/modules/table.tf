locals {
  table_partition_key  = "id"
  table_data_attribute = "data"
}

resource "aws_dynamodb_table" "table" {
  name         = "${var.application}-${var.environment}-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = local.table_partition_key

  attribute {
    name = local.table_partition_key
    type = "S"
  }

}



