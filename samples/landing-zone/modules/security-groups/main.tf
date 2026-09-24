locals {
  ingress_rules = merge([
    for sg_name, sg in var.security_groups : {
      for rule in sg.ingress : "${sg_name}-${rule.port}-${coalesce(rule.cidr, rule.source_sg)}" => merge(rule, { sg = sg_name })
    }
  ]...)
}

resource "aws_security_group" "this" {
  for_each    = var.security_groups
  name        = "${var.name_prefix}-${each.key}"
  description = each.value.description
  vpc_id      = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "this" {
  for_each = local.ingress_rules

  security_group_id            = aws_security_group.this[each.value.sg].id
  from_port                    = each.value.port
  to_port                      = each.value.port
  ip_protocol                  = "tcp"
  cidr_ipv4                    = each.value.cidr
  referenced_security_group_id = each.value.source_sg == null ? null : aws_security_group.this[each.value.source_sg].id
}

resource "aws_vpc_security_group_egress_rule" "all" {
  for_each          = aws_security_group.this
  security_group_id = each.value.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
