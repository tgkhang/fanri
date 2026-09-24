data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

data "aws_route53_zone" "public" {
  provider     = aws.network
  name         = var.public_domain
  private_zone = false
}

data "aws_acm_certificate" "wildcard" {
  domain   = "*.${var.public_domain}"
  statuses = ["ISSUED"]
}
