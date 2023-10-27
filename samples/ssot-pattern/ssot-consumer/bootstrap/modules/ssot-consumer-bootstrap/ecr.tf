resource "aws_ecr_repository" "ssot_consumer_ecr" {
  name                 = "${var.application}-${var.environment}-ssot-stow-inventory"

  image_scanning_configuration {
    scan_on_push = true
  }
}