# The API server used to be a single root-level instance before the ec2-app module existed.
moved {
  from = aws_instance.api
  to   = module.apps["api"].aws_instance.this[0]
}
