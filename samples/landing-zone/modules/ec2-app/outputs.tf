output "instance_ids" {
  value = aws_instance.this[*].id
}

output "private_ips" {
  value = aws_instance.this[*].private_ip
}

output "role_arn" {
  value = aws_iam_role.this.arn
}
