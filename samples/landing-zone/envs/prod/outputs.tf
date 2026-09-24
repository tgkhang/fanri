output "vpc_id" {
  value = module.network.vpc_id
}

output "api_url" {
  value = "https://${aws_route53_record.api.fqdn}"
}

output "alb_dns_name" {
  value = aws_lb.public.dns_name
}

output "app_instance_ids" {
  value = { for name, app in module.apps : name => app.instance_ids }
}
