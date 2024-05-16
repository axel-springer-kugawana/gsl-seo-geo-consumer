output "function_arn" {
  value = aws_lambda_function.lambda_function.arn
}

output "function_name" {
  value = aws_lambda_function.lambda_function.function_name
}

output "sg_id" {
  description = "The ID of the security group"
  value       = try(aws_security_group.lambda_vpc_sg[0].id, aws_security_group.lambda_vpc_sg[0].id, "")
}
