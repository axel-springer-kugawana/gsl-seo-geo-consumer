output "properties" {
  value = {
    # Holds the aurora credentials, filled by hand after the first apply. Shared
    # with the geo bulk load task, which reads the same database.
    db_secret_arn  = aws_secretsmanager_secret.lambda_consumer_credentials.arn
    db_secret_name = aws_secretsmanager_secret.lambda_consumer_credentials.name
  }
}
