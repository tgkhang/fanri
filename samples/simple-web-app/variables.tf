variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project" {
  type    = string
  default = "simple-web"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "instance_count" {
  type    = number
  default = 2
}

variable "domain_name" {
  description = "Existing public hosted zone, e.g. example.com"
  type        = string
}

variable "admin_cidrs" {
  description = "CIDRs allowed to SSH"
  type        = list(string)
  default     = []
}
