locals {
  config = yamldecode(file("${path.module}/../../config/accounts.yaml"))

  top_level_ous = { for ou in local.config.organizational_units : ou.name => ou if try(ou.parent, null) == null }
  child_ous     = { for ou in local.config.organizational_units : ou.name => ou if try(ou.parent, null) != null }

  accounts = merge([
    for ou in local.config.organizational_units : {
      for acct in try(ou.accounts, []) : acct.name => merge(acct, { ou = ou.name })
    }
  ]...)

  scp_attachments = merge([
    for policy, cfg in local.config.service_control_policies : {
      for target in cfg.targets : "${policy}/${target}" => { policy = policy, target = target }
    }
  ]...)
}

resource "aws_organizations_organization" "this" {
  feature_set                   = local.config.organization.feature_set
  aws_service_access_principals = ["cloudtrail.amazonaws.com", "config.amazonaws.com", "sso.amazonaws.com"]
  enabled_policy_types          = ["SERVICE_CONTROL_POLICY"]
}

resource "aws_organizations_organizational_unit" "top" {
  for_each  = local.top_level_ous
  name      = each.key
  parent_id = aws_organizations_organization.this.roots[0].id
}

resource "aws_organizations_organizational_unit" "child" {
  for_each  = local.child_ous
  name      = each.key
  parent_id = aws_organizations_organizational_unit.top[each.value.parent].id
}

resource "aws_organizations_account" "this" {
  for_each  = local.accounts
  name      = each.key
  email     = each.value.email
  parent_id = try(aws_organizations_organizational_unit.top[each.value.ou].id, aws_organizations_organizational_unit.child[each.value.ou].id)

  lifecycle {
    ignore_changes = [role_name]
  }
}

resource "aws_organizations_policy" "scp" {
  for_each = local.config.service_control_policies
  name     = each.key
  type     = "SERVICE_CONTROL_POLICY"
  content  = file("${path.module}/policies/${each.key}.json")
}

resource "aws_organizations_policy_attachment" "scp" {
  for_each  = local.scp_attachments
  policy_id = aws_organizations_policy.scp[each.value.policy].id
  target_id = try(aws_organizations_organizational_unit.top[each.value.target].id, aws_organizations_organizational_unit.child[each.value.target].id)
}

resource "aws_s3_bucket" "central_logs" {
  bucket = "example-central-logs-${local.config.organization.management_account_id}"
}

resource "aws_s3_bucket_versioning" "central_logs" {
  bucket = aws_s3_bucket.central_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_cloudtrail" "org" {
  name                  = "org-trail"
  s3_bucket_name        = aws_s3_bucket.central_logs.id
  is_organization_trail = true
  is_multi_region_trail = true
  depends_on            = [aws_s3_bucket_versioning.central_logs]
}

output "account_ids" {
  value = { for name, acct in aws_organizations_account.this : name => acct.id }
}

output "central_log_bucket" {
  value = aws_s3_bucket.central_logs.id
}
