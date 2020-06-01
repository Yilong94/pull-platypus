provider "aws" {
  region = "ap-southeast-1"
}

variable "bitbucket_to_slack_map" {
  type = string
}

variable "webhook_secret" {
  type = string
}

variable "webhook_url" {
  type = string
}

# Lambda function
resource "aws_lambda_function" "bitbucket_pull_reminder" {
  function_name = "bitbucket_pull_reminder"
  filename = "./dummy.zip"
  handler  = "index.handler"
  role    = aws_iam_role.iam_bitbucket_pull_reminder.arn
  runtime = "nodejs12.x"
  environment {
    variables = {
      BITBUCKET_TO_SLACK_MAP = var.bitbucket_to_slack_map
      WEBHOOK_SECRET         = var.webhook_secret
      WEBHOOK_URL            = var.webhook_url
    }
  }
  # kms_key_arn: ?
}

# Assume role
resource "aws_iam_role" "iam_bitbucket_pull_reminder" {
  name = "iam_bitbucket_pull_reminder"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

}

# Create policy for logging
resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

# Attach policy to IAM role
resource "aws_iam_role_policy_attachment" "lambda_loggging_policy_attachment" {
  role       = aws_iam_role.iam_bitbucket_pull_reminder.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

# Permission for API GW to access lambda
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bitbucket_pull_reminder.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bitbucket_pull_reminder.execution_arn}/production/POST/bitbucket-pull-reminder"
}
