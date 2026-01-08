# output "queue_arn" {
#   value = module.connector_internal_queue.queue_arn
# }

# output "queue_id" {
#   value = module.connector_internal_queue.queue_id
# }

output "queue_fifo_arn" {
  value = module.connector_internal_queue_fifo.queue_arn
}

output "queue_fifo_id" {
  value = module.connector_internal_queue_fifo.queue_id
}
