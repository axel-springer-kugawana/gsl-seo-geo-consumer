locals {
  state_of_world_table_partition_key  = "id"
  state_of_world_table_data_attribute = "data"
  state_of_world_table_partition_attribute = "partition"
  state_of_world_table_data_version_attribute = "dataModelVersion"
  state_of_world_table_version_attribute = "version"

}

resource "aws_dynamodb_table" "state_of_world_table" {
  name         = "${var.application}-${var.environment}-state-of-the-world-table"
  billing_mode = "PAY_PER_REQUEST"

  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  hash_key     = local.state_of_world_table_partition_key
  
  attribute {
    name = local.state_of_world_table_partition_key
    type = "S"
  }

}



