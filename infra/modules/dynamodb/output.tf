output "properties" {
  value = {
    dynamodb_arn        = aws_dynamodb_table.consumer_materialized_view_table.arn
    dynamodb_table_name = aws_dynamodb_table.consumer_materialized_view_table.name
  }
}
