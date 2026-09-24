# The dev VPC was first built by hand. These bring it under Terraform without recreating it.
import {
  to = module.network.aws_vpc.this
  id = "vpc-0aaaabbbbccccdddd"
}

import {
  to = module.network.aws_internet_gateway.this
  id = "igw-0aaaabbbbccccdddd"
}
