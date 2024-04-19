output "queue_arn" {
  value = module.connector_internal_queue.queue_arn
}

output "queue_id" {
  value = module.connector_internal_queue.queue_id
}

#testfu
output "sg_id" {
  value = module.handle_cm_events_lambda.function_name
}
