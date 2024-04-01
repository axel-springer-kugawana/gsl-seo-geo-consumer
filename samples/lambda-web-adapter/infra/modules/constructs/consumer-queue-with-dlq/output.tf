output "queue_arn" {
  value = aws_sqs_queue.consumer_queue.arn
}

output "queue_id" {
  value = aws_sqs_queue.consumer_queue.id
}

output "queue_url" {
  value = aws_sqs_queue.consumer_queue.url
}
