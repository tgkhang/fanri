resource "aws_route53_record" "web" {
  zone_id = data.aws_route53_zone.public.zone_id
  name    = "${var.environment}.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = aws_eip.web[*].public_ip
}
