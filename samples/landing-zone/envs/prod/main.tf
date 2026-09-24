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

# Registry module: fanri shows it as a placeholder until `terraform init` has run (Tier 0 → Tier 1).
module "vpc_endpoints" {
  source  = "terraform-aws-modules/vpc/aws//modules/vpc-endpoints"
  version = "~> 5.8"

  vpc_id             = module.network.vpc_id
  security_group_ids = [module.security_groups.ids["app"]]
  subnet_ids         = module.network.subnet_ids.private

  endpoints = {
    s3          = { service = "s3", service_type = "Gateway", route_table_ids = module.network.private_route_table_ids }
    ssm         = { service = "ssm", private_dns_enabled = true }
    ec2messages = { service = "ec2messages", private_dns_enabled = true }
    ssmmessages = { service = "ssmmessages", private_dns_enabled = true }
  }
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
  root_volume_size   = 50
}

# ── Public entry point ───────────────────────────────
resource "aws_lb" "public" {
  name               = "${local.name}-public"
  load_balancer_type = "application"
  subnets            = module.network.subnet_ids.public
  security_groups    = [module.security_groups.ids["alb"]]
}

resource "aws_lb_target_group" "api" {
  name     = "${local.name}-api"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = module.network.vpc_id

  health_check {
    path = "/healthz"
  }
}

resource "aws_lb_target_group_attachment" "api" {
  count            = local.apps.api.count
  target_group_arn = aws_lb_target_group.api.arn
  target_id        = module.apps["api"].instance_ids[count.index]
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.public.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = data.aws_acm_certificate.wildcard.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_route53_record" "api" {
  provider = aws.network
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = "api.${var.public_domain}"
  type     = "A"

  alias {
    name                   = aws_lb.public.dns_name
    zone_id                = aws_lb.public.zone_id
    evaluate_target_health = true
  }
}

module "dns" {
  source = "../../modules/dns"

  zone_name = local.network.private_zone
  vpc_id    = module.network.vpc_id
  records   = { for name, app in local.apps : app.dns_name => module.apps[name].private_ips }
}

# Central platform module from another team's repo: stays a placeholder unless mapped locally (Tier 1b).
module "monitoring" {
  source = "git::https://git.example.com/platform/terraform-aws-monitoring.git?ref=v2.3.0"

  name          = local.name
  instance_ids  = flatten([for app in module.apps : app.instance_ids])
  alb_arn       = aws_lb.public.arn
  webhook_token = var.alarm_webhook_token
}
