variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "shopping-fraud-detector"
}

variable "lightsail_bundle_id" {
  description = "Lightsail bundle ID (instance size)"
  type        = string
  default     = "nano_2_0"

  # Available bundles:
  # nano_2_0: 512 MB RAM, 1 vCPU, 20 GB SSD
  # micro_2_0: 1 GB RAM, 1 vCPU, 40 GB SSD
  # small_2_0: 2 GB RAM, 1 vCPU, 60 GB SSD
  # medium_2_0: 4 GB RAM, 2 vCPU, 80 GB SSD
  # large_2_0: 8 GB RAM, 2 vCPU, 160 GB SSD
}

variable "claude_api_key" {
  description = "Claude API key for AI features"
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^sk-ant-", var.claude_api_key))
    error_message = "Claude API key must start with 'sk-ant-'."
  }
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch retention period."
  }
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.dynamodb_billing_mode)
    error_message = "Billing mode must be PROVISIONED or PAY_PER_REQUEST."
  }
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
