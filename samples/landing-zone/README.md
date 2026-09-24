# Sample landing zone

A made-up but realistic AWS landing zone for testing fanri. Nothing here points to real accounts.

```
landing-zone/
├── config/                 # YAML source of truth, read with yamldecode()
│   ├── accounts.yaml       #   OUs and accounts
│   ├── network.yaml        #   VPC CIDRs and subnets per environment
│   └── workloads.yaml      #   EC2 apps and their security-group rules per environment
├── global/
│   └── organization/       # OUs, SCPs, central logging bucket (management account)
├── modules/                # local modules → expandable containers in fanri (FR-3.1)
│   ├── network/            #   VPC, subnets, IGW, NAT, route tables, flow logs
│   ├── security-groups/    #   SGs + rules generated from YAML
│   ├── ec2-app/            #   EC2 + IAM role/instance profile, count-based
│   └── dns/                #   private Route 53 zone + records
└── envs/
    ├── dev/                # root module: local modules only
    └── prod/               # root module: local + registry + git ("central") modules → placeholders (FR-3.2)
```

What it exercises in fanri:

| Feature | Where |
| --- | --- |
| Local modules, nested containers | `envs/*/main.tf` → `modules/*` |
| Unresolved external modules (git, registry) | `envs/prod/main.tf` (`monitoring`, `vpc_endpoints`) |
| `count` / `for_each` badges | `modules/ec2-app`, `modules/network`, `modules/security-groups` |
| Cross-module references (`module.x.y`) | `envs/*/main.tf` |
| `data` sources, `import` / `moved` blocks | `envs/*/data.tf`, `imports.tf`, `moved.tf` |
| YAML-driven config | `config/*.yaml` via `yamldecode(file(...))` |
| Sensitive values to mask | `envs/prod/variables.tf` (`alarm_webhook_token`) |
