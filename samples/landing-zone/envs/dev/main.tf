module "network" {
  source = "../../modules/network"

  name                = local.name
  vpc_cidr            = local.network.vpc_cidr
  azs                 = local.network.azs
  public_subnets      = local.network.subnets.public
  private_subnets     = local.network.subnets.private
  data_subnets        = local.network.subnets.data
  single_nat_gateway  = local.network.single_nat_gateway
  flow_log_bucket_arn = var.central_log_bucket_arn
}

module "security_groups" {
  source = "../../modules/security-groups"

  name_prefix     = local.name
  vpc_id          = module.network.vpc_id
  security_groups = local.workloads.security_groups
}

module "apps" {
  source   = "../../modules/ec2-app"
  for_each = local.apps

  name               = "${local.name}-${each.key}"
  instance_type      = each.value.instance_type
  instance_count     = each.value.count
  ami_id             = data.aws_ami.al2023.id
  subnet_ids         = module.network.subnet_ids[each.value.subnet_tier]
  security_group_ids = [for sg in each.value.security_groups : module.security_groups.ids[sg]]
}

module "dns" {
  source = "../../modules/dns"

  zone_name = local.network.private_zone
  vpc_id    = module.network.vpc_id
  records   = { for name, app in local.apps : app.dns_name => module.apps[name].private_ips }
}
