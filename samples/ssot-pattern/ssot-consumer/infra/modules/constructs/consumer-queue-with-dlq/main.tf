resource "aws_sqs_queue" "consumer_dlq" {
  name = "${var.consumer_sqs_name}-dlq"
}


resource "aws_sqs_queue" "consumer_queue" {
  name = var.consumer_sqs_name
  visibility_timeout_seconds = var.queue_visibility_timeout
    redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.consumer_dlq.arn
    maxReceiveCount     = var.retry_count
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "consumer_dlq_redrive_policy" {
  queue_url = aws_sqs_queue.consumer_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.consumer_queue.arn]
  })
}