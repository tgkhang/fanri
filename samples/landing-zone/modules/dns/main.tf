resource "aws_route53_zone" "private" {
  name = var.zone_name

  vpc {
    vpc_id = var.vpc_id
  }
}

resource "aws_route53_record" "this" {
  for_each = var.records
  zone_id  = aws_route53_zone.private.zone_id
  name     = "${each.key}.${var.zone_name}"
  type     = "A"
  ttl      = 60
  records  = each.value
}
