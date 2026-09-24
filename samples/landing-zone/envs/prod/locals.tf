locals {
  network   = yamldecode(file("${path.module}/../../config/network.yaml"))[var.environment]
  workloads = yamldecode(file("${path.module}/../../config/workloads.yaml"))
  apps      = local.workloads.apps[var.environment]

  name = "lz-${var.environment}"

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Repo        = "landing-zone"
    CostCenter  = "platform"
  }
}
