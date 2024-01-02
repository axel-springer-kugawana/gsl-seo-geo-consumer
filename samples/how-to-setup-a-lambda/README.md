⚠️ Still work in progress ⚠️ 

# How to setup a lambda

## About the samples

A few constructs are proposed so they can be reused

## Types of lambdas

### Non-VPC lambda

This is the most simple lambda to setup as all the network part is already done by AWS.

[Full construct sources](./infra/modules/constructs/lambda-nonvpc/)

#### 1/ Generating a zip file from the lambda code

```hx
data "archive_file" "zip_the_lambda_code" {
  type        = "zip"
  source_dir  = var.lambda_dist_dir
  output_path = "${path.module}/${var.lambda_function_name}.zip"
}
```

[Sources](./infra/modules/constructs/lambda-nonvpc/main.tf#L1-L5)

#### 2/ Configuring the lambda

```hx
resource "aws_lambda_function" "lambda_function" {
  function_name    = var.lambda_function_name
  filename         = data.archive_file.zip_the_lambda_code.output_path
  role             = var.lambda_role_arn
  handler          = var.lambda_handler
  source_code_hash = filebase64sha256(data.archive_file.zip_the_lambda_code.output_path)
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.lambda_timeout
  environment {
    variables = var.env_variables
  }
}
```

[Sources](./infra/modules/constructs/lambda-nonvpc/main.tf#L7-L19)

#### 3/ Configuring the log group

**Important:** Provide a **rentention** to prevent the logs to stay forever and increase the cost of the account !

```hx
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.cloudwatch_log_retention
}
```

[Sources](./infra/modules/constructs/lambda-nonvpc/main.tf#L21-L24)

### VPC lambda

This is like the Non-VPC lambda but we need to setup extra network as we are going to use custom VPC instead of AWS one.

[Full construct sources](./infra/modules/constructs/lambda-vpc/)




### Edge lambda

*TODO*



[More](https://avivgroup.atlassian.net/wiki/spaces/AARCH/pages/401900975/Setting+up+an+AWS+lambda)