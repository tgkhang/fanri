output "instance_ids" {
  value = aws_instance.web[*].id
}

output "public_ips" {
  value = aws_eip.web[*].public_ip
}

output "url" {
  value = "http://${aws_route53_record.web.fqdn}"
}
