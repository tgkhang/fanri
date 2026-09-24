import type { CloudPlugin } from "@fanri/core";

const CATEGORIES: Record<string, string> = {
  aws_vpc: "network",
  aws_subnet: "network",
  aws_security_group: "security",
  aws_instance: "compute",
  aws_lambda_function: "compute",
  aws_s3_bucket: "storage",
  aws_db_instance: "database",
  aws_iam_role: "identity",
};

export const awsPlugin: CloudPlugin = {
  name: "aws",
  providers: ["aws"],
  decorate(node) {
    const category = node.type ? CATEGORIES[node.type] : undefined;
    return category ? { category } : undefined;
  },
};
