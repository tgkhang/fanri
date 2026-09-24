output "ids" {
  description = "Security group IDs by logical name (alb, app, db, ...)"
  value       = { for name, sg in aws_security_group.this : name => sg.id }
}
