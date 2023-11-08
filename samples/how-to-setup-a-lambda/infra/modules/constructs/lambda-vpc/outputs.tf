output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.lambda_function.arn
}

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.lambda_function.function_name
}