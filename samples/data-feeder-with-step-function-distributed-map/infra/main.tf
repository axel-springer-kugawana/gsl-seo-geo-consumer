
module "classified_feeder" {
    source = "./modules/data-feeder/classified-feeder"
    classified_feeder_lambda_dist_dir = "../src/dist/data-feeder/lambdas"
    classified_data_s3_bucket_arn = "arn:aws:s3:::cd-sandbox-a-bucket-to-test-feeder"
    classified_data_s3_bucket_name = "cd-sandbox-a-bucket-to-test-feeder"
    classified_data_topic_arn = "TEST"
    application = "data-feeder-sample"
    environment = "sandbox"
}
