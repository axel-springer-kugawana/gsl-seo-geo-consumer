module "lambda_not_in_vpc" {
  source                   = "./modules/constructs/lambda-nonvpc"
  lambda_function_name     = "sample-nonvpc" #
  lambda_dist_dir          = "../src/dist/lambda-nonvpc/"
  lambda_handler           = "lambda-nonvpc.handler"
  env_variables            = []
  runtime                  = "nodejs18.x"
  memory_size              = 512
  lambda_timeout           = ""
  lambda_role_arn          = ""
  cloudwatch_log_retention = 3 # Log retention in days, avoid never expiring logs
}

module "lambda_inside_vpc" {
  source                   = "./modules/constructs/lambda-vpc"
  lambda_function_name     = "sample-vpc"
  lambda_dist_dir          = "../src/dist/lambda-vpc/"
  lambda_handler           = "lambda-vpc.handler"
  env_variables            = []
  runtime                  = "nodejs18.x"
  memory_size              = 512
  lambda_timeout           = ""
  lambda_role_arn          = ""
  cloudwatch_log_retention = 3                            # Log retention in days, avoid never expiring logs
  vpc_id                   = data.aws_vpc.default         # You may want to use the default VPC of the AWS account
  subnet_ids               = data.aws_subnets.application # Should be the "application" subnets
}
