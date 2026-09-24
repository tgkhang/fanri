output "vpc_id" {
  value = aws_vpc.this.id
}

output "vpc_cidr" {
  value = aws_vpc.this.cidr_block
}

output "subnet_ids" {
  value = {
    public  = aws_subnet.public[*].id
    private = aws_subnet.private[*].id
    data    = aws_subnet.data[*].id
  }
}

output "private_route_table_ids" {
  value = aws_route_table.private[*].id
}
