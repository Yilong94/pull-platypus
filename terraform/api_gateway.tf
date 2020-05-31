# API Container
resource "aws_api_gateway_rest_api" "bitbucket_pull_reminder" {
  name        = "bitbucket_pull_reminder"
  description = "API webhook endpoint for Bitbucket Pull Reminder"
}

# API resource
resource "aws_api_gateway_resource" "bitbucket_pull_reminder_resource" {
  rest_api_id = aws_api_gateway_rest_api.bitbucket_pull_reminder.id
  parent_id   = aws_api_gateway_rest_api.bitbucket_pull_reminder.root_resource_id
  path_part   = "bitbucket-pull-reminder"
}

# API method
resource "aws_api_gateway_method" "bitbucket_pull_reminder_method" {
  rest_api_id   = aws_api_gateway_rest_api.bitbucket_pull_reminder.id
  resource_id   = aws_api_gateway_resource.bitbucket_pull_reminder_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# Lambda proxy integration
resource "aws_api_gateway_integration" "bitbucket_pull_reminder_integration" {
  rest_api_id             = aws_api_gateway_rest_api.bitbucket_pull_reminder.id
  resource_id             = aws_api_gateway_resource.bitbucket_pull_reminder_resource.id
  http_method             = aws_api_gateway_method.bitbucket_pull_reminder_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.bitbucket_pull_reminder.invoke_arn
}

# GW deployment
resource "aws_api_gateway_deployment" "bitbucket_pull_reminder_deployment" {
  depends_on = [
    aws_api_gateway_integration.bitbucket_pull_reminder_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.bitbucket_pull_reminder.id
  stage_name  = "production"
}

output "base_url" {
  value = aws_api_gateway_deployment.bitbucket_pull_reminder_deployment.invoke_url
}
