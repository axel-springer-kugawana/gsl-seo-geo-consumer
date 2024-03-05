locals {
  team   = "Avengers"
  planet = "Earth"
}

#=== tsfunc lambda

data "archive_file" "tsfunc" {
  type        = "zip"
  source_file = "../src/tsfunc/dist/index.js"
  output_path = "../src/tsfunc/dist/index.zip"
}

resource "aws_lambda_function" "tsfunc" {
  function_name    = "${var.service_name}_tsfunc"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.tsfunc.output_path
  role             = aws_iam_role.allow_lambda.arn
  memory_size      = 256
  source_code_hash = filebase64sha256(data.archive_file.tsfunc.output_path)
  logging_config {
    log_format            = "JSON"
    application_log_level = "INFO"
    system_log_level      = "WARN"
  }
  environment {
    variables = {
      POWERTOOLS_SERVICE_NAME = var.service_name
      APP_TEAM                = local.team
      APP_PLANET              = local.planet
    }
  }
}

resource "aws_cloudwatch_log_group" "tsfunc" {
  name              = "/aws/lambda/${aws_lambda_function.tsfunc.function_name}"
  retention_in_days = 3
}

#=== csfunc lambda

data "archive_file" "csfunc" {
  type        = "zip"
  source_dir  = "../src/csfunc/CsFunc/bin/Release/net8.0/"
  output_path = "../src/csfunc/CsFunc/bin/Release/CsFunc.zip"
}

resource "aws_lambda_function" "csfunc" {
  function_name    = "${var.service_name}_csfunc"
  handler          = "CsFunc"
  runtime          = "dotnet8"
  filename         = data.archive_file.csfunc.output_path
  role             = aws_iam_role.allow_lambda.arn
  memory_size      = 512
  source_code_hash = filebase64sha256(data.archive_file.csfunc.output_path)
  logging_config {
    log_format            = "JSON"
    application_log_level = "INFO"
    system_log_level      = "WARN"
  }
  environment {
    variables = {
      POWERTOOLS_SERVICE_NAME = var.service_name
      ANNOTATIONS_HANDLER     = "Handler"
      APP_TEAM                = local.team
      APP_PLANET              = local.planet
    }
  }
}

resource "aws_cloudwatch_log_group" "csfunc" {
  name              = "/aws/lambda/${aws_lambda_function.csfunc.function_name}"
  retention_in_days = 3
}

