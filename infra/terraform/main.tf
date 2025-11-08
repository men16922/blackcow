terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state (optional - uncomment to use)
  # backend "s3" {
  #   bucket = "shopping-fraud-detector-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "ap-northeast-2"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "shopping-fraud-detector"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# AWS Lightsail Instance
resource "aws_lightsail_instance" "app_server" {
  name              = "${var.project_name}-${var.environment}"
  availability_zone = "${var.aws_region}a"
  blueprint_id      = "nodejs_18"
  bundle_id         = var.lightsail_bundle_id

  # User data script for initial setup
  user_data = templatefile("${path.module}/user-data.sh", {
    node_env        = var.environment
    claude_api_key  = var.claude_api_key
  })

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# Lightsail Static IP
resource "aws_lightsail_static_ip" "app_ip" {
  name = "${var.project_name}-${var.environment}-ip"
}

resource "aws_lightsail_static_ip_attachment" "app_ip_attachment" {
  static_ip_name = aws_lightsail_static_ip.app_ip.name
  instance_name  = aws_lightsail_instance.app_server.name
}

# DynamoDB Tables
resource "aws_dynamodb_table" "products" {
  name           = "${var.project_name}-products-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "url"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  global_secondary_index {
    name            = "UrlIndex"
    hash_key        = "url"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "CreatedAtIndex"
    hash_key        = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = {
    Name = "Products Table"
  }
}

resource "aws_dynamodb_table" "analysis_history" {
  name           = "${var.project_name}-analysis-history-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "productId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "ProductIdIndex"
    hash_key        = "productId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = {
    Name = "Analysis History Table"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/lightsail/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "Application Logs"
  }
}

# IAM Role for Lightsail (if needed)
resource "aws_iam_role" "lightsail_role" {
  name = "${var.project_name}-lightsail-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lightsail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "Lightsail IAM Role"
  }
}

# IAM Policy for DynamoDB access
resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "${var.project_name}-dynamodb-policy"
  role = aws_iam_role.lightsail_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.products.arn,
          "${aws_dynamodb_table.products.arn}/index/*",
          aws_dynamodb_table.analysis_history.arn,
          "${aws_dynamodb_table.analysis_history.arn}/index/*"
        ]
      }
    ]
  })
}

# CloudWatch Alarm for high CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/Lightsail"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors lightsail cpu utilization"

  dimensions = {
    InstanceName = aws_lightsail_instance.app_server.name
  }

  tags = {
    Name = "High CPU Alarm"
  }
}
