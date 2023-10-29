output "ssot_consumer_queue_arn" {
  value = module.ssot_events_consumer_queue.queue_arn
}

output "ssot_consumer_queue_id" {
  value = module.ssot_events_consumer_queue.queue_id
}
