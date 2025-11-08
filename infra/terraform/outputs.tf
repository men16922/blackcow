output "lightsail_instance_id" {
  description = "ID of the Lightsail instance"
  value       = aws_lightsail_instance.app_server.id
}

output "lightsail_instance_name" {
  description = "Name of the Lightsail instance"
  value       = aws_lightsail_instance.app_server.name
}

output "lightsail_public_ip" {
  description = "Public IP address of the Lightsail instance"
  value       = aws_lightsail_static_ip.app_ip.ip_address
}

output "lightsail_username" {
  description = "Default username for SSH access"
  value       = aws_lightsail_instance.app_server.username
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_lightsail_static_ip.app_ip.ip_address}"
}

output "dynamodb_products_table_name" {
  description = "Name of the Products DynamoDB table"
  value       = aws_dynamodb_table.products.name
}

output "dynamodb_products_table_arn" {
  description = "ARN of the Products DynamoDB table"
  value       = aws_dynamodb_table.products.arn
}

output "dynamodb_analysis_history_table_name" {
  description = "Name of the Analysis History DynamoDB table"
  value       = aws_dynamodb_table.analysis_history.name
}

output "dynamodb_analysis_history_table_arn" {
  description = "ARN of the Analysis History DynamoDB table"
  value       = aws_dynamodb_table.analysis_history.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "iam_role_arn" {
  description = "ARN of the IAM role for Lightsail"
  value       = aws_iam_role.lightsail_role.arn
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh ${aws_lightsail_instance.app_server.username}@${aws_lightsail_static_ip.app_ip.ip_address}"
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    environment = var.environment
    region      = var.aws_region
    instance    = aws_lightsail_instance.app_server.name
    public_ip   = aws_lightsail_static_ip.app_ip.ip_address
  }
}
