output "function_arn" {
  value = aws_lambda_function.lambda_function.arn
}

output "function_name" {
  value = aws_lambda_function.lambda_function.function_name
}

#testfu
output "sg_id" {
  value = aws_security_group.lambda_vpc_sg.id
}
