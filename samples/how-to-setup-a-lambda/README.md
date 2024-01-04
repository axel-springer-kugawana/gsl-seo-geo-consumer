⚠️ Still work in progress ⚠️ 

# How to setup a lambda

## About the samples

Here a few reusable constructs are proposed and explained.

You can still find more in this documentation: [Setting up an AWS lambda](https://avivgroup.atlassian.net/wiki/spaces/AARCH/pages/401900975/Setting+up+an+AWS+lambda)

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

---

#### 2/ Configuring the lambda

Note: The role is created outside the construct and so it can be generic.

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

---

#### 3/ Configuring the log group

**Important:** Provide a **rentention** to prevent the logs to stay forever and increase the cost of the account !

```hx
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.cloudwatch_log_retention
}
```

[Sources](./infra/modules/constructs/lambda-nonvpc/main.tf#L21-L24)

---

### VPC lambda

This is like the Non-VPC lambda but we need to setup extra network as we are going to use custom VPC instead of AWS one.

[Full construct sources](./infra/modules/constructs/lambda-vpc/)

**1/ Create a security group**

Note: This is where you are going to do the link with the VPC that is provided as a parameter

```hx
resource "aws_security_group" "lambda_vpc_sg" {
  name        = lower("${var.lambda_function_name}-vpc-sg")
  description = "${var.lambda_function_name} server access security group"
  vpc_id      = var.vpc_id
}
```

[Sources](./infra/modules/constructs/lambda-vpc/main.tf#L10-L14)

---

**2/ Create a security group rule**

This allow the lambda to call APIs or any AWS resources

```hx
resource "aws_security_group_rule" "allow_https" {
  type              = "egress"
  description       = "HTTPS egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
  security_group_id = aws_security_group.lambda_vpc_sg.id
}
```

[Sources](./infra/modules/constructs/lambda-vpc/main.tf#L16-L25)

---

**3/ Add the VPC configuration to the lambda fonction**

Note: Provides the subnet_ids (Should correspond to the application subnet) and the previously created security group.

```hx
  vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = [aws_security_group.lambda_vpc_sg.id]
  }
```

[Sources](./infra/modules/constructs/lambda-vpc/main.tf#L41-L44)

---

**4/ Add the log subscription filter**

```hx
resource "aws_cloudwatch_log_subscription_filter" "datadog" {
  name            = "${var.lambda_function_name}_datadog_logfilter"
  role_arn        = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/datadog-kinesis-metrics"
  log_group_name  = aws_cloudwatch_log_group.lambda_log_group.name
  filter_pattern  = ""
  destination_arn = "arn:aws:firehose:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:deliverystream/DatadogCWLogsforwarder"
}
```

[Sources](./infra/modules/constructs/lambda-vpc/main.tf#L52-L58)

---

### Edge lambda

*TODO*

## Data sources

Terraform allow you to define data sources to use informations defined outside Terraform, we defined some of them in a separated file outside the modules and constructs so they are defined once and shared via parameters when needed.

**data.aws_ssm_parameter.account_name**: Retrieve the account name from the parameter store that has been set by the AVIV AWS Foundation, so you don't have to hardcode it.

```hx
data "aws_ssm_parameter" "account_name" {
  name = "/aft/account-request/custom-fields/account_name"
}
```

[Sources](./infra/data.tf#L1-L3)

---

**data.aws_vpc.default**: Retrieve the default VPC of the account set by the AVIV AWS Foundation that will be used by VPC lambdas.

```hx
data "aws_vpc" "default" {
  filter {
    name = "tag:Name"
    values = [
      data.aws_ssm_parameter.account_name.value
    ]
  }
}
```

[Sources](./infra/data.tf#L5-L12)

---

**data.aws_subnets.application**: Retrieve the application subnet of the account set by the AVIV AWS Foundation that will be used by VPC lambdas.

```hx
data "aws_subnets" "application" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "tag:Labels"
    values = ["*application*"]
  }
}
```

[Sources](./infra/data.tf#L14-L23)

---