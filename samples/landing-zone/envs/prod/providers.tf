provider "aws" {
  region = var.region

  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/TerraformDeploy"
  }

  default_tags {
    tags = local.tags
  }
}

# Public DNS and ACM certificates for CloudFront live in us-east-1 in the shared-network account.
provider "aws" {
  alias  = "network"
  region = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::${var.network_account_id}:role/TerraformDeploy"
  }
}
