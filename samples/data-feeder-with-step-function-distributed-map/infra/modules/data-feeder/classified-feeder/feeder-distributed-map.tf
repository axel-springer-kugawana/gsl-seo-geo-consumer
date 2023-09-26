data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_iam_role" "step_function_role" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "states.amazonaws.com"
        }
      },
    ]
  })
}

data "aws_iam_policy_document" "step_function_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      var.classified_data_s3_bucket_arn
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction",
    ]
    resources = [
      module.classified_feeder_handling_lambda.function_arn
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "states:StartExecution",
    ]
    resources = [
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${aws_sfn_state_machine.classified_feeder_state_machine.name}"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "states:DescribeExecution", "states:StopExecution"
    ]
    resources = [
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${aws_sfn_state_machine.classified_feeder_state_machine.name}/*"
    ]
  }
}

resource "aws_iam_policy" "iam_policy_for_step_function" {
  policy = data.aws_iam_policy_document.step_function_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_step_function_iam_policy_to_iam_role" {
  role       = aws_iam_role.step_function_role.name
  policy_arn = aws_iam_policy.iam_policy_for_step_function.arn
}

resource "aws_sfn_state_machine" "classified_feeder_state_machine" {
  name     = "${var.application}-${var.environment}-classified-feeder"
  role_arn = aws_iam_role.step_function_role.arn

  definition = <<EOF
{
  "Comment": "classified feeder state machine",
  "StartAt": "S3 object keys",
  "States": {
      "S3 object keys": {
          "Type": "Map",
          "ItemProcessor": {
              "ProcessorConfig": {
                  "Mode": "DISTRIBUTED",
                  "ExecutionType": "STANDARD"
              },
              "StartAt": "Lambda Invoke",
              "States": {
                  "Lambda Invoke": {
                      "Type": "Task",
                      "Resource": "arn:aws:states:::lambda:invoke",
                      "OutputPath": "$.Payload",
                      "Parameters": {
                          "Payload.$": "$",
                          "FunctionName": "${module.classified_feeder_handling_lambda.function_name}"
                      },
                      "Retry": [
                          {
                              "ErrorEquals": [
                                  "Lambda.ServiceException",
                                  "Lambda.AWSLambdaException",
                                  "Lambda.SdkClientException",
                                  "Lambda.TooManyRequestsException"
                              ],
                              "IntervalSeconds": 2,
                              "MaxAttempts": 6,
                              "BackoffRate": 2
                          }
                      ],
                      "End": true
                  }
              }
          },
          "ItemReader": {
              "Resource": "arn:aws:states:::s3:listObjectsV2",
              "Parameters": {
                  "Bucket": "${var.classified_data_s3_bucket_name}",
                  "Prefix": "${var.prefix}"
              }
          },
          "MaxConcurrency": 300,
          "Label": "S3objectkeys",
          "ItemBatcher": {
             "MaxItemsPerBatch": 30
          },
          "End": true,
          "ResultPath": null
      }
  }
}
EOF
}

resource "aws_cloudwatch_log_group" "classified_feeder_state_machine_log_group" {
  retention_in_days = 7
}
