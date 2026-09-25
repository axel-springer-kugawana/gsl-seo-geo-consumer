
resource "aws_s3_bucket" "geo_legacy_mapping" {
  bucket = "${var.aws_account_name}-seo-geo-legacy-mapping"
}