variable "zone_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "records" {
  description = "Record name → list of private IPs"
  type        = map(list(string))
  default     = {}
}
