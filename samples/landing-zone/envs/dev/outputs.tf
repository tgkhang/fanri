output "vpc_id" {
  value = module.network.vpc_id
}

output "app_instance_ids" {
  value = { for name, app in module.apps : name => app.instance_ids }
}

output "dns" {
  value = module.dns.fqdns
}

output "deployed_by" {
  value = data.aws_caller_identity.current.arn
}
