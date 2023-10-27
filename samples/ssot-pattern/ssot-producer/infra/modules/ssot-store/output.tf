output "state_of_world_table_arn" {
  value = aws_dynamodb_table.state_of_world_table.arn
}

output "state_of_world_table_name" {
  value = aws_dynamodb_table.state_of_world_table.name
}

output "state_of_world_table_stream_arn" {
  value = aws_dynamodb_table.state_of_world_table.stream_arn
}