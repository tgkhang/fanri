variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "security_groups" {
  description = "Map from config/workloads.yaml → security_groups"
  type = map(object({
    description = string
    ingress = list(object({
      port      = number
      cidr      = optional(string)
      source_sg = optional(string)
    }))
  }))
}
