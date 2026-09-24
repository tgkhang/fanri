resource "aws_instance" "web" {
  count = var.instance_count

  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = element(data.aws_subnets.default.ids, count.index)
  vpc_security_group_ids = [aws_security_group.web.id]

  user_data = <<-EOT
    #!/bin/bash
    dnf install -y nginx
    systemctl enable --now nginx
  EOT

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name = "${local.name_prefix}-web-${count.index}"
  }
}

resource "aws_eip" "web" {
  count    = var.instance_count
  instance = aws_instance.web[count.index].id
  domain   = "vpc"
}
