
module "classified_feeder" {
  source                            = "./modules/data-feeder/classified-feeder"
  classified_feeder_lambda_dist_dir = "../src/dist/data-feeder/lambdas"
  list_object_lambda_dist_dir       = "../src/dist/data-feeder/lambdas"
  classified_data_s3_bucket_arn     = "arn:aws:s3:::testing-distributed-map"
  classified_data_s3_bucket_name    = "testing-distributed-map"
  list_of_files_bucket_name         = "cd-feeder-file-list"
  list_of_files_bucket_arn          = "arn:aws:s3:::cd-feeder-file-list"
  classified_data_topic_arn         = "TEST"
  application                       = "data-feeder-sample"
  environment                       = "sandbox"
  ecr_arn                           = "arn:aws:ecr:*:*:repository/ssot-consumer*" 
}



