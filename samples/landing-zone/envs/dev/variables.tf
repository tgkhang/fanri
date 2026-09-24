variable "region" {
  type = string
}

variable "account_id" {
  type = string
}

variable "environment" {
  type = string
}

variable "central_log_bucket_arn" {
  type    = string
  default = null
}
