variable "region" {
  type = string
}

variable "account_id" {
  type = string
}

variable "network_account_id" {
  type = string
}

variable "environment" {
  type = string
}

variable "public_domain" {
  type = string
}

variable "central_log_bucket_arn" {
  type = string
}

variable "alarm_webhook_token" {
  description = "Chat webhook token for alarms. Comes from CI secrets, never from tfvars."
  type        = string
  sensitive   = true
}
