output "zone_id" {
  value = aws_route53_zone.private.zone_id
}

output "fqdns" {
  value = { for name, rec in aws_route53_record.this : name => rec.fqdn }
}
