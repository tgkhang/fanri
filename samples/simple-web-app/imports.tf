# Adopt a security group that was created by hand in the console (Terraform >= 1.5 import blocks).
import {
  to = aws_security_group.web
  id = "sg-0123456789abcdef0"
}
