# ArgoCD ApplicationSets for Multi-Customer, Multi-Product Deployments

This directory contains ApplicationSet examples for managing deployments across 20+ customers with multiple products using GitOps.

## Repository Structure

### Two Main Repositories

1. **platform-infrastructure** (`http://localhost:7990/scm/test/platform-infrastructure.git`)
   - Contains Helm charts and base manifests
   - ApplicationSet definitions
   - Reusable infrastructure code

2. **customer-configs** (`http://localhost:7990/scm/test/customer-configs.git`)
   - Customer-specific configurations
   - Helm values per customer per product
   - Secrets (encrypted)
   - Terraform configurations
   - JSON schemas for validation

## ApplicationSet Files

### Basic Applications (01-06)
Simple Application manifests for infrastructure components:
- `01-nginx-ingress.yaml` - Ingress controller
- `02-metrics-server.yaml` - Metrics collection
- `03-redis.yaml` - Redis cache
- `04-grafana.yaml` - Monitoring dashboard
- `05-prometheus.yaml` - Metrics storage
- `06-cert-manager.yaml` - Certificate management

### Multi-Customer ApplicationSets (07-10)
Basic multi-customer patterns:
- `07-multi-customer-app-set.yaml` - Simple multi-customer deployments
- `08-monitoring-stack-set.yaml` - Deploy monitoring per customer
- `09-database-per-customer-set.yaml` - Database deployments
- `10-environment-promotion-set.yaml` - Dev/Staging/Prod promotion

### Product-Based ApplicationSets (11-14) ⭐ RECOMMENDED
Advanced patterns for multi-product, multi-customer scenarios:

#### `11-product-customer-matrix-set.yaml`
Deploys products to customers based on directory structure.
- **Generator**: Git directories (`customers/*/*/values.yaml`)
- **Use Case**: Deploy all products to all customers
- **Namespace**: `{customer}-{product}`

#### `12-product-by-environment-set.yaml`
Deploys products across multiple environments with proper value layering.
- **Generator**: Matrix (customers × environments)
- **Use Case**: Dev/Staging/Prod deployments
- **Value Precedence**:
  1. Product base values
  2. Product environment defaults
  3. Customer product values
  4. Customer environment overrides
- **Namespace**: `{customer}-{product}-{env}`

#### `13-customer-product-list-set.yaml`
Subscription-based deployments using customer product lists.
- **Generator**: Git files (`customers/*/products.yaml`)
- **Use Case**: Customers subscribe to specific products
- **Namespace**: `{customer}`

#### `14-customer-with-secrets-set.yaml`
Secure deployments with encrypted secrets.
- **Generator**: Git files (`customers/*/*/values.yaml`)
- **Features**:
  - SOPS/Sealed Secrets support
  - Vault integration via argocd-vault-plugin
  - Separate secret manifests
- **Namespace**: `{customer}-{product}`

## Customer-Configs Repository Structure

```
customer-configs/
├── customers/
│   └── customer-01/
│       ├── metadata.yaml              # Customer info
│       ├── products.yaml              # Enabled products
│       ├── product-a/
│       │   ├── values.yaml            # Helm values
│       │   ├── values.schema.json     # Validation schema
│       │   ├── secrets.yaml           # Encrypted secrets
│       │   └── environments/
│       │       ├── dev.yaml
│       │       ├── staging.yaml
│       │       └── prod.yaml
│       ├── terraform/                 # Customer infrastructure
│       │   ├── main.tf
│       │   └── variables.tf
│       └── configs/
│           └── feature-flags.yaml
├── products/
│   └── product-a/
│       ├── base-values.yaml           # Default values
│       ├── values.schema.json         # Schema
│       └── environments/
│           ├── dev.yaml
│           ├── staging.yaml
│           └── prod.yaml
└── shared/
    ├── terraform-modules/
    └── common-secrets/
```

## Value Merge Order

Values are merged in this order (later overrides earlier):

1. `products/{product}/base-values.yaml` - Product defaults
2. `products/{product}/environments/{env}.yaml` - Product env defaults
3. `customers/{customer}/{product}/values.yaml` - Customer overrides
4. `customers/{customer}/{product}/environments/{env}.yaml` - Customer env overrides

## Getting Started

### 1. Create the Repositories

```bash
# On Bitbucket Server at http://localhost:7990/
# Create project TEST if not exists
# Create repositories:
# - platform-infrastructure
# - customer-configs
```

### 2. Initialize customer-configs

```bash
git clone http://localhost:7990/scm/test/customer-configs.git
cd customer-configs

# Create structure for first customer
mkdir -p customers/customer-01/product-a/environments
mkdir -p customers/customer-01/terraform
mkdir -p products/product-a/environments
mkdir -p shared/terraform-modules

# Add files (see EXAMPLE_customer-configs-structure.md)
git add .
git commit -m "Initial customer configs structure"
git push
```

### 3. Initialize platform-infrastructure

```bash
git clone http://localhost:7990/scm/test/platform-infrastructure.git
cd platform-infrastructure

# Create structure
mkdir -p applicationsets
mkdir -p products/product-a/templates
mkdir -p base-manifests

# Copy ApplicationSets
cp /path/to/11-product-customer-matrix-set.yaml applicationsets/
cp /path/to/12-product-by-environment-set.yaml applicationsets/

# Add Helm charts (see EXAMPLE_platform-infrastructure-structure.md)
git add .
git commit -m "Initial infrastructure setup"
git push
```

### 4. Register Repositories with ArgoCD

**IMPORTANT**: Before deploying ApplicationSets, register your Git repositories:

```bash
# Add repositories to ArgoCD
argocd repo add http://localhost:7990/scm/test/platform-infrastructure.git \
  --username <your-username> \
  --password <your-password>

argocd repo add http://localhost:7990/scm/test/customer-configs.git \
  --username <your-username> \
  --password <your-password>

# Verify repositories are added
argocd repo list

# Test connectivity
argocd repo get http://localhost:7990/scm/test/customer-configs.git
```

### 5. Deploy ApplicationSets

```bash
# Apply to ArgoCD
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml
kubectl apply -f applicationsets/12-product-by-environment-set.yaml

# Watch applications being created
kubectl get applications -n argocd -w

# If no applications appear, check logs
kubectl logs -n argocd deployment/argocd-applicationset-controller -f
```

## Adding a New Customer

1. Create customer directory:
```bash
cd customer-configs
mkdir -p customers/customer-02/product-a
```

2. Add configuration files:
```bash
# customers/customer-02/metadata.yaml
# customers/customer-02/products.yaml
# customers/customer-02/product-a/values.yaml
```

3. Commit and push:
```bash
git add customers/customer-02
git commit -m "Add customer-02"
git push
```

4. ArgoCD automatically creates the application!

## Adding a New Product

1. Add product to infrastructure repo:
```bash
cd platform-infrastructure
mkdir -p products/product-d/templates
# Add Helm chart files
```

2. Add product defaults to config repo:
```bash
cd customer-configs
mkdir -p products/product-d/environments
# Add base-values.yaml and schema
```

3. Enable for customers:
```bash
# Add to customers/customer-01/products.yaml
# Create customers/customer-01/product-d/values.yaml
```

## Secret Management

### Option 1: Sealed Secrets
```bash
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
```

### Option 2: SOPS
```bash
sops --encrypt secrets.yaml > secrets.enc.yaml
```

### Option 3: Vault (with argocd-vault-plugin)
```yaml
# In secrets.yaml
apiVersion: v1
kind: Secret
stringData:
  password: <path:secret/data/customer-01#password>
```

## Validation

Use JSON schemas to validate customer configurations:

```bash
# Install ajv-cli
npm install -g ajv-cli

# Validate customer values
ajv validate -s products/product-a/values.schema.json \
  -d customers/customer-01/product-a/values.yaml
```

## Best Practices

1. **Use schemas**: Always define `values.schema.json` for products
2. **Encrypt secrets**: Never commit plain-text secrets
3. **Layer values**: Use the 4-layer merge strategy
4. **Namespace isolation**: One namespace per customer-product(-env)
5. **Auto-sync carefully**: Disable for production environments
6. **Git branches**: Use branches for environment promotion
7. **Terraform state**: Use remote backends (S3, GCS, etc.)
8. **Documentation**: Keep metadata.yaml updated

## Troubleshooting

### Application not created
- Check ApplicationSet logs: `kubectl logs -n argocd deployment/argocd-applicationset-controller`
- Verify file paths match generator patterns
- Ensure git repo is accessible

### Values not merging correctly
- Check value file paths in ApplicationSet
- Verify `$values` reference is correct
- Test locally with `helm template`

### Secrets not decrypting
- Verify SOPS/Sealed Secrets is installed
- Check argocd-vault-plugin configuration
- Ensure proper RBAC permissions

## References

- [ArgoCD ApplicationSets Documentation](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/)
- [Helm Values Files](https://helm.sh/docs/chart_template_guide/values_files/)
- [SOPS](https://github.com/mozilla/sops)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [ArgoCD Vault Plugin](https://argocd-vault-plugin.readthedocs.io/)
