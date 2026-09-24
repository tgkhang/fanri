# Adopt the public hosted-zone record that was created by the old CloudFormation stack.
import {
  provider = aws.network
  to       = aws_route53_record.api
  id       = "Z0123456789ABCDEFGHIJ_api.example.com_A"
}

import {
  to = aws_lb.public
  id = "arn:aws:elasticloadbalancing:ap-southeast-1:333333333333:loadbalancer/app/lz-prod-public/0123456789abcdef"
}
