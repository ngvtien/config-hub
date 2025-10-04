# Customer Configs Repository Structure

This document shows the recommended structure for the `customer-configs` repository when managing multiple products across 20+ customers.

## Directory Structure

```
customer-configs/
├── customers/
│   ├── customer-01/
│   │   ├── metadata.yaml
│   │   ├── products.yaml
│   │   ├── product-a/
│   │   │   ├── values.yaml
│   │   │   ├── values.schema.json
│   │   │   ├── secrets.yaml (sealed/encrypted)
│   │   │   └── environments/
│   │   │       ├── dev.yaml
│   │   │       ├── staging.yaml
│   │   │       └── prod.yaml
│   │   ├── product-b/
│   │   │   ├── values.yaml
│   │   │   ├── values.schema.json
│   │   │   └── secrets.yaml
│   │   ├── terraform/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   └── terraform.tfvars
│   │   └── configs/
│   │       ├── feature-flags.yaml
│   │       └── custom-config.yaml
│   ├── customer-02/
│   │   ├── metadata.yaml
│   │   ├── products.yaml
│   │   ├── product-a/
│   │   │   ├── values.yaml
│   │   │   └── secrets.yaml
│   │   ├── terraform/
│   │   └── configs/
│   └── ...
├── products/
│   ├── product-a/
│   │   ├── base-values.yaml
│   │   ├── values.schema.json
│   │   └── environments/
│   │       ├── dev.yaml
│   │       ├── staging.yaml
│   │       └── prod.yaml
│   ├── product-b/
│   │   ├── base-values.yaml
│   │   ├── values.schema.json
│   │   └── environments/
│   └── product-c/
│       ├── base-values.yaml
│       └── values.schema.json
├── shared/
│   ├── terraform-modules/
│   │   ├── networking/
│   │   ├── database/
│   │   └── monitoring/
│   └── common-secrets/
│       └── registry-credentials.yaml
└── README.md
```

## Example Files

### customers/customer-01/metadata.yaml
```yaml
customer: customer-01
name: "Acme Corporation"
tier: premium
region: us-east-1
contact: ops@acme.example.com
billingId: "ACME-001"
tags:
  - enterprise
  - sla-99.9
```

### customers/customer-01/products.yaml
```yaml
customer: customer-01
products:
  - name: product-a
    enabled: true
    version: "1.2.0"
  - name: product-b
    enabled: true
    version: "2.0.0"
  - name: product-c
    enabled: false
```

### customers/customer-01/product-a/values.yaml
```yaml
# Customer-specific overrides for product-a
replicaCount: 3
image:
  tag: "1.2.0"
resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi
ingress:
  enabled: true
  host: acme.product-a.example.com
  tls:
    enabled: true
    secretName: acme-tls-cert
database:
  type: postgres
  replicas: 2
  storage: 50Gi
  backupEnabled: true
features:
  advancedAnalytics: true
  apiRateLimit: 10000
```

### customers/customer-01/product-a/values.schema.json
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["replicaCount", "image", "database"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10
    },
    "image": {
      "type": "object",
      "properties": {
        "tag": {
          "type": "string",
          "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        }
      }
    },
    "database": {
      "type": "object",
      "properties": {
        "type": {
          "enum": ["postgres", "mysql", "mongodb"]
        },
        "storage": {
          "type": "string",
          "pattern": "^[0-9]+Gi$"
        }
      }
    }
  }
}
```

### customers/customer-01/product-a/secrets.yaml
```yaml
# Sealed/encrypted secrets (use sealed-secrets, SOPS, or Vault)
apiVersion: v1
kind: Secret
metadata:
  name: product-a-secrets
type: Opaque
stringData:
  database-password: ENC[AES256_GCM,data:xxx,iv:yyy,tag:zzz]
  api-key: ENC[AES256_GCM,data:xxx,iv:yyy,tag:zzz]
  oauth-client-secret: ENC[AES256_GCM,data:xxx,iv:yyy,tag:zzz]
```

### customers/customer-01/product-a/environments/prod.yaml
```yaml
# Production-specific overrides for customer-01's product-a
replicaCount: 5
resources:
  requests:
    cpu: 500m
    memory: 512Mi
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
monitoring:
  enabled: true
  alerting: true
```

### customers/customer-01/terraform/main.tf
```hcl
# Customer-specific infrastructure
terraform {
  backend "s3" {
    bucket = "terraform-state-customer-01"
    key    = "customer-01/terraform.tfstate"
    region = "us-east-1"
  }
}

module "vpc" {
  source = "../../shared/terraform-modules/networking"
  
  customer_name = "customer-01"
  cidr_block    = "10.1.0.0/16"
  region        = var.region
}

module "rds" {
  source = "../../shared/terraform-modules/database"
  
  customer_name   = "customer-01"
  instance_class  = "db.r5.xlarge"
  allocated_storage = 100
  vpc_id          = module.vpc.vpc_id
}
```

### customers/customer-01/terraform/variables.tf
```hcl
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
```

### customers/customer-01/configs/feature-flags.yaml
```yaml
# Customer-specific feature flags
features:
  newDashboard: true
  betaFeatures: true
  experimentalAPI: false
  advancedReporting: true
  multiRegion: true
```

### products/product-a/base-values.yaml
```yaml
# Default values for product-a across all customers
replicaCount: 2
image:
  repository: myregistry/product-a
  tag: "1.0.0"
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
service:
  type: ClusterIP
  port: 80
ingress:
  enabled: false
database:
  type: postgres
  replicas: 1
  storage: 10Gi
```

### products/product-a/values.schema.json
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product A Configuration Schema",
  "type": "object",
  "required": ["replicaCount", "image"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "description": "Number of replicas"
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {"type": "string"},
        "tag": {"type": "string"}
      }
    }
  }
}
```

## Value Precedence

Values are merged in this order (later overrides earlier):
1. Product base values (`products/product-a/base-values.yaml`)
2. Product environment defaults (`products/product-a/environments/prod.yaml`)
3. Customer product values (`customers/customer-01/product-a/values.yaml`)
4. Customer environment overrides (`customers/customer-01/product-a/environments/prod.yaml`)

## File Purposes

### Per Customer
- **metadata.yaml**: Customer info, tier, region, contacts
- **products.yaml**: Which products are enabled for this customer
- **product-x/values.yaml**: Customer-specific Helm values for product-x
- **product-x/values.schema.json**: Validation schema for customer values
- **product-x/secrets.yaml**: Encrypted secrets (use SOPS/Sealed Secrets/Vault)
- **product-x/environments/*.yaml**: Environment-specific overrides
- **terraform/**: Customer-specific infrastructure as code
- **configs/**: Additional config files (feature flags, etc.)

### Per Product
- **base-values.yaml**: Default Helm values for all customers
- **values.schema.json**: Schema to validate customer overrides
- **environments/*.yaml**: Environment-specific defaults

### Shared
- **terraform-modules/**: Reusable Terraform modules
- **common-secrets/**: Shared secrets (registry credentials, etc.)

## Benefits

- **Customer-Centric**: Each customer has their own folder with all configs
- **Separation of Concerns**: Infrastructure code separate from config
- **DRY Principle**: Shared defaults with customer overrides
- **Scalability**: Easy to add new customers or products
- **Flexibility**: Customers can subscribe to different products
- **Environment Promotion**: Same config structure across dev/staging/prod
- **Validation**: JSON schemas ensure config correctness
- **Security**: Secrets encrypted at rest
- **IaC Integration**: Terraform configs alongside Helm values
