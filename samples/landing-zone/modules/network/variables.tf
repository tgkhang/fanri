variable "name" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "azs" {
  type = list(string)
}

variable "public_subnets" {
  type = list(string)
}

variable "private_subnets" {
  type = list(string)
}

variable "data_subnets" {
  type = list(string)
}

variable "single_nat_gateway" {
  type    = bool
  default = true
}

variable "flow_log_bucket_arn" {
  type    = string
  default = null
}
