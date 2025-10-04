# Repository Summary: Multi-Customer GitOps Architecture

## Executive Summary

This architecture manages 20+ customers across multiple products using GitOps principles with ArgoCD ApplicationSets and two Git repositories on Bitbucket Server.

## Repository Names & URLs

### 1. platform-infrastructure
**URL**: `http://localhost:7990/scm/test/platform-infrastructure.git`

**Purpose**: DevOps and infrastructure code
- Helm charts for all products
- ArgoCD ApplicationSet definitions
- Base Kubernetes manifests
- Reusable infrastructure templates

**Key Contents**:
- `/applicationsets/` - ApplicationSet YAML files
- `/products/` - Helm charts for each product
- `/base-manifests/` - Shared K8s manifests
- `/charts/` - External chart references

### 2. customer-configs
**URL**: `http://localhost:7990/scm/test/customer-configs.git`

**Purpose**: Customer-specific configurations
- Helm values per customer per product
- Encrypted secrets
- Terraform infrastructure code
- JSON schemas for validation
- Feature flags and custom configs

**Key Contents**:
- `/customers/{customer-id}/` - All configs for each customer
  - `metadata.yaml` - Customer information
  - `products.yaml` - Enabled products list
  - `{product-name}/values.yaml` - Product-specific values
  - `{product-name}/secrets.yaml` - Encrypted secrets
  - `{product-name}/environments/` - Per-environment overrides
  - `terraform/` - Customer infrastructure as code
  - `configs/` - Additional configuration files
- `/products/{product-name}/` - Product defaults
  - `base-values.yaml` - Default Helm values
  - `values.schema.json` - Validation schema
  - `environments/` - Environment-specific defaults
- `/shared/` - Shared resources
  - `terraform-modules/` - Reusable Terraform modules
  - `common-secrets/` - Shared secrets

## Architecture Benefits

### Separation of Concerns
- **Infrastructure code** (platform-infrastructure) separate from **configuration** (customer-configs)
- Changes to infrastructure don't affect customer configs
- Customer configs can be managed by different teams

### Scalability
- Easy to add new customers (just add a directory)
- Easy to add new products (add Helm chart + base values)
- ApplicationSets automatically create applications

### Security
- Secrets encrypted at rest (SOPS/Sealed Secrets/Vault)
- Customer isolation via namespaces
- RBAC can be applied per customer

### Flexibility
- Customers can subscribe to different products
- Per-customer, per-product, per-environment customization
- Value layering allows DRY principle

### GitOps
- All changes via Git commits
- Full audit trail
- Easy rollback
- Automated deployments

## ApplicationSet Patterns

### Pattern 1: Product-Customer Matrix (File 11)
**Use Case**: Deploy all products to all customers
**Generator**: Git files matching `customers/*/*/values.yaml`
**Result**: One application per customer-product combination

### Pattern 2: Multi-Environment (File 12)
**Use Case**: Deploy across dev/staging/prod
**Generator**: Matrix of customers × environments
**Result**: One application per customer-product-environment

### Pattern 3: Subscription-Based (File 13)
**Use Case**: Customers subscribe to specific products
**Generator**: Git files matching `customers/*/products.yaml`
**Result**: Only enabled products are deployed

### Pattern 4: With Secrets (File 14)
**Use Case**: Secure deployments with encrypted secrets
**Generator**: Git files with secret manifests
**Result**: Applications with integrated secret management

### Pattern 5: Terraform Infrastructure (File 15)
**Use Case**: Manage customer infrastructure as code
**Generator**: Git directories matching `customers/*/terraform`
**Result**: Terraform workspaces per customer

## Value Merge Strategy

Values are merged in this order (later overrides earlier):

1. **Product Base** (`products/{product}/base-values.yaml`)
   - Default values for all customers
   
2. **Product Environment** (`products/{product}/environments/{env}.yaml`)
   - Environment-specific defaults (dev/staging/prod)
   
3. **Customer Product** (`customers/{customer}/{product}/values.yaml`)
   - Customer-specific overrides
   
4. **Customer Environment** (`customers/{customer}/{product}/environments/{env}.yaml`)
   - Customer + environment specific overrides

Example:
```
base: replicaCount=1, cpu=50m
+ prod env: replicaCount=3, cpu=200m
+ customer: replicaCount=5, memory=512Mi
+ customer prod: cpu=500m
= Final: replicaCount=5, cpu=500m, memory=512Mi
```

## Typical Workflows

### Onboard New Customer
1. Create `customers/customer-XX/` directory
2. Add `metadata.yaml` and `products.yaml`
3. For each product, create `{product}/values.yaml`
4. Commit and push
5. ApplicationSet automatically creates applications

### Deploy New Product
1. Add Helm chart to `platform-infrastructure/products/{product}/`
2. Add base values to `customer-configs/products/{product}/`
3. Enable for customers in their `products.yaml`
4. Create customer-specific values
5. Commit and push both repos

### Update Customer Configuration
1. Edit `customers/{customer}/{product}/values.yaml`
2. Commit and push
3. ArgoCD auto-syncs (if enabled) or manual sync

### Promote to Production
1. Test in dev environment
2. Merge to staging branch
3. Verify in staging
4. Merge to main/prod branch
5. Manual sync for production (auto-sync disabled)

### Add Customer Infrastructure
1. Create `customers/{customer}/terraform/` directory
2. Add Terraform files (main.tf, variables.tf, etc.)
3. Reference shared modules from `/shared/terraform-modules/`
4. Commit and push
5. Terraform operator applies changes

## File Organization Examples

### Customer with 2 Products
```
customers/acme-corp/
├── metadata.yaml
├── products.yaml
├── product-a/
│   ├── values.yaml
│   ├── secrets.yaml
│   └── environments/
│       ├── dev.yaml
│       ├── staging.yaml
│       └── prod.yaml
├── product-b/
│   ├── values.yaml
│   └── secrets.yaml
├── terraform/
│   ├── main.tf
│   └── variables.tf
└── configs/
    └── feature-flags.yaml
```

### Product with Defaults
```
products/product-a/
├── base-values.yaml
├── values.schema.json
└── environments/
    ├── dev.yaml
    ├── staging.yaml
    └── prod.yaml
```

## Technology Stack

- **GitOps**: ArgoCD with ApplicationSets
- **Container Orchestration**: Kubernetes
- **Package Management**: Helm
- **Version Control**: Git (Bitbucket Server)
- **Secret Management**: SOPS / Sealed Secrets / Vault
- **Infrastructure as Code**: Terraform
- **Validation**: JSON Schema

## Scaling Considerations

### Current: 20+ Customers
- Works well with directory-based structure
- ApplicationSets handle generation efficiently
- Git repo size manageable

### Future: 100+ Customers
- Consider splitting customer-configs by region/tier
- Use Git submodules or mono-repo tools
- Implement caching strategies
- Consider database-backed configuration

### Multiple Clusters
- Update ApplicationSet destinations
- Use cluster generators
- Implement cluster-specific overrides

## Security Best Practices

1. **Secrets**: Always encrypt (never commit plain-text)
2. **RBAC**: Limit access per customer/product
3. **Namespaces**: Isolate customers
4. **Network Policies**: Restrict inter-customer traffic
5. **Audit**: Enable Git commit signing
6. **Scanning**: Scan for secrets in commits
7. **Validation**: Use JSON schemas to prevent misconfigurations

## Monitoring & Observability

- ArgoCD application health status
- Sync status and errors
- Git commit tracking
- Helm release history
- Kubernetes events
- Application metrics per customer

## Disaster Recovery

- Git history provides full audit trail
- Easy rollback via Git revert
- Helm rollback for application issues
- Terraform state backups
- Regular cluster backups

## Documentation Files

- `README_APPLICATIONSETS.md` - Detailed ApplicationSet documentation
- `EXAMPLE_customer-configs-structure.md` - Customer configs structure
- `EXAMPLE_platform-infrastructure-structure.md` - Infrastructure structure
- `QUICK_START.md` - Step-by-step setup guide
- `REPO_SUMMARY.md` - This file

## Getting Started

See `QUICK_START.md` for detailed setup instructions.

Quick commands:
```bash
# Clone repos
git clone http://localhost:7990/scm/test/platform-infrastructure.git
git clone http://localhost:7990/scm/test/customer-configs.git

# Deploy ApplicationSets
kubectl apply -f platform-infrastructure/applicationsets/

# Watch applications
kubectl get applications -n argocd -w
```

## Support & Maintenance

- Regular updates to base values
- Security patches via image tag updates
- Schema updates for new features
- Terraform module improvements
- Documentation updates

---

**Last Updated**: 2025-10-04
**Version**: 1.0.0
**Maintainer**: DevOps Team
