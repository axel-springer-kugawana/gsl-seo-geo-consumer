resource "aws_s3_bucket" "state_of_world_inventory_bucket" {
  bucket = "${var.application}-${var.environment}-state-of-the-world-inventory-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_of_world_bucket_bucket_encryption" {
  bucket = aws_s3_bucket.state_of_world_inventory_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "AES256"
    }
  }
}