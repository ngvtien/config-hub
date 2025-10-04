# Multi-Customer GitOps Documentation Index

Complete documentation for managing 20+ customers across multiple products using ArgoCD ApplicationSets and GitOps.

## 📚 Documentation Files

### Getting Started
1. **[QUICK_START.md](QUICK_START.md)** ⭐ START HERE
   - Step-by-step setup guide
   - Commands to initialize repositories
   - **Repository registration with ArgoCD** (CRITICAL!)
   - Quick examples for adding customers and products

2. **[CHEAT_SHEET.md](CHEAT_SHEET.md)** 📋 QUICK REFERENCE
   - One-page command reference
   - Common tasks
   - File structure overview
   - Quick troubleshooting

3. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** 🔧 COMMON ISSUES
   - Application NotFound errors
   - Repository authentication issues
   - ApplicationSet not generating apps
   - Values not being applied
   - Diagnostic commands

4. **[REPO_SUMMARY.md](REPO_SUMMARY.md)**
   - Executive summary
   - Repository purposes and URLs
   - Architecture benefits
   - Workflows and patterns

5. **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)**
   - Visual diagrams
   - Flow charts
   - Repository structures
   - Value merge flow

### Detailed Documentation
6. **[README_APPLICATIONSETS.md](README_APPLICATIONSETS.md)**
   - Complete ApplicationSet reference
   - All patterns explained (files 01-15)
   - Repository registration steps
   - Best practices

7. **[EXAMPLE_customer-configs-structure.md](EXAMPLE_customer-configs-structure.md)**
   - Customer-configs repository structure
   - Example files with full content
   - Value precedence rules
   - File purposes

8. **[EXAMPLE_platform-infrastructure-structure.md](EXAMPLE_platform-infrastructure-structure.md)**
   - Platform-infrastructure repository structure
   - Helm chart examples
   - Template examples

## 🎯 Repository Information

### Repository Names
- **platform-infrastructure** - Infrastructure code, Helm charts, ApplicationSets
- **customer-configs** - Customer values, secrets, Terraform configs

### Bitbucket URLs
- Project: `TEST` at `http://localhost:7990/TEST`
- Repo 1: `http://localhost:7990/scm/test/platform-infrastructure.git`
- Repo 2: `http://localhost:7990/scm/test/customer-configs.git`

## 📁 ApplicationSet Files

### Basic Applications (01-06)
Simple infrastructure components:
- `01-nginx-ingress.yaml` - Ingress controller
- `02-metrics-server.yaml` - Metrics collection
- `03-redis.yaml` - Redis cache
- `04-grafana.yaml` - Monitoring dashboard
- `05-prometheus.yaml` - Metrics storage
- `06-cert-manager.yaml` - Certificate management

### Multi-Customer Patterns (07-10)
Basic multi-customer deployments:
- `07-multi-customer-app-set.yaml` - Simple multi-customer pattern
- `08-monitoring-stack-set.yaml` - Monitoring per customer
- `09-database-per-customer-set.yaml` - Database deployments
- `10-environment-promotion-set.yaml` - Dev/Staging/Prod

### Advanced Product-Based Patterns (11-15) ⭐ RECOMMENDED
Multi-product, multi-customer scenarios:
- `11-product-customer-matrix-set.yaml` - Deploy products to customers
- `12-product-by-environment-set.yaml` - Multi-environment deployments
- `13-customer-product-list-set.yaml` - Subscription-based deployments
- `14-customer-with-secrets-set.yaml` - Secure deployments with secrets
- `15-terraform-infrastructure-set.yaml` - Infrastructure as code

## 🚀 Quick Reference

### Add New Customer
```bash
cd customer-configs
mkdir -p customers/customer-XX/{product-a,terraform,configs}
# Create metadata.yaml, products.yaml, values.yaml
git add customers/customer-XX
git commit -m "Add customer-XX"
git push
```

### Add New Product
```bash
# In platform-infrastructure
mkdir -p products/product-X/templates
# Create Chart.yaml, values.yaml, templates/

# In customer-configs
mkdir -p products/product-X/environments
# Create base-values.yaml, values.schema.json
```

### Update Customer Config
```bash
cd customer-configs
# Edit customers/customer-01/product-a/values.yaml
git commit -am "Update customer-01 product-a config"
git push
# ArgoCD auto-syncs (if enabled)
```

### Deploy ApplicationSet
```bash
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml
kubectl get applications -n argocd -w
```

## 📊 Repository Structures

### customer-configs
```
customers/
├── customer-01/
│   ├── metadata.yaml
│   ├── products.yaml
│   ├── product-a/
│   │   ├── values.yaml
│   │   ├── secrets.yaml
│   │   └── environments/
│   ├── terraform/
│   └── configs/
products/
├── product-a/
│   ├── base-values.yaml
│   ├── values.schema.json
│   └── environments/
shared/
├── terraform-modules/
└── common-secrets/
```

### platform-infrastructure
```
applicationsets/
├── 11-product-customer-matrix-set.yaml
├── 12-product-by-environment-set.yaml
└── ...
products/
├── product-a/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
base-manifests/
```

## 🔄 Value Merge Order

1. `products/{product}/base-values.yaml` - Product defaults
2. `products/{product}/environments/{env}.yaml` - Env defaults
3. `customers/{customer}/{product}/values.yaml` - Customer overrides
4. `customers/{customer}/{product}/environments/{env}.yaml` - Customer env overrides

## 🔐 Security Features

- **Encrypted Secrets**: SOPS / Sealed Secrets / Vault
- **Namespace Isolation**: One namespace per customer-product
- **RBAC**: Git, Kubernetes, and ArgoCD levels
- **Validation**: JSON schemas for config validation
- **Audit Trail**: Full Git history

## 🎓 Learning Path

### Beginner
1. Read [QUICK_START.md](QUICK_START.md)
2. Review [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)
3. Set up first customer using examples

### Intermediate
1. Read [README_APPLICATIONSETS.md](README_APPLICATIONSETS.md)
2. Understand value merge strategy
3. Implement secret management
4. Add multiple customers

### Advanced
1. Read [REPO_SUMMARY.md](REPO_SUMMARY.md)
2. Customize ApplicationSets for your needs
3. Implement Terraform integration
4. Set up multi-environment promotion
5. Scale to 100+ customers

## 🛠️ Common Tasks

### View Applications
```bash
kubectl get applications -n argocd
kubectl get applications -n argocd -l customer=customer-01
```

### Sync Application
```bash
argocd app sync customer-01-product-a
argocd app get customer-01-product-a
```

### Troubleshoot
```bash
# ApplicationSet logs
kubectl logs -n argocd deployment/argocd-applicationset-controller

# Application status
kubectl describe application customer-01-product-a -n argocd

# Test Helm template
helm template test ./products/product-a \
  -f products/product-a/base-values.yaml \
  -f customers/customer-01/product-a/values.yaml
```

## 📞 Support

### Troubleshooting
**See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions** 🔧

### Most Common Issue: Application NotFound
```bash
# 1. Check if repos are registered (THIS IS USUALLY THE PROBLEM!)
argocd repo list

# 2. If empty or missing repos, add them:
argocd repo add http://localhost:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>

argocd repo add http://localhost:7990/scm/test/customer-configs.git \
  --username <user> --password <pass>

# 3. Verify connectivity
argocd repo get http://localhost:7990/scm/test/customer-configs.git

# 4. Check ApplicationSet logs
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=50
```

### Other Common Issues
- Application not created → Check repo registration first, then ApplicationSet logs
- Values not merging → Verify file paths in ApplicationSet
- Secrets not decrypting → Check encryption setup (SOPS/Sealed Secrets/Vault)

## 🔗 External Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [ApplicationSets Guide](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/)
- [Helm Documentation](https://helm.sh/docs/)
- [SOPS](https://github.com/mozilla/sops)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)

## 📝 File Descriptions

| File | Purpose | Audience |
|------|---------|----------|
| INDEX.md | This file - navigation hub | Everyone |
| QUICK_START.md | Step-by-step setup | New users |
| REPO_SUMMARY.md | Architecture overview | Decision makers |
| ARCHITECTURE_DIAGRAM.md | Visual diagrams | Visual learners |
| README_APPLICATIONSETS.md | Complete reference | Operators |
| EXAMPLE_customer-configs-structure.md | Config examples | Developers |
| EXAMPLE_platform-infrastructure-structure.md | Infrastructure examples | DevOps |

## 🎯 Use Cases

### Scenario 1: SaaS Platform
- Multiple customers (tenants)
- Each customer gets same products
- Customer-specific configurations
- **Use**: Files 11, 12, 14

### Scenario 2: Managed Services
- Customers subscribe to different products
- Per-customer infrastructure (Terraform)
- Different tiers (premium, standard)
- **Use**: Files 13, 14, 15

### Scenario 3: Multi-Environment
- Dev, Staging, Production
- Progressive deployment
- Environment-specific configs
- **Use**: Files 10, 12

### Scenario 4: Hybrid
- Mix of all above
- Complex requirements
- **Use**: Combine multiple patterns

## 📈 Scaling Guide

| Customers | Strategy | Files |
|-----------|----------|-------|
| 1-20 | Single repo | All current files |
| 20-50 | Optimize git operations | Add caching |
| 50-100 | Consider repo split | Split by region |
| 100+ | Database-backed or multi-repo | Custom solution |

## ✅ Checklist

### Initial Setup
- [ ] Create Bitbucket repositories
- [ ] Initialize customer-configs structure
- [ ] Initialize platform-infrastructure structure
- [ ] Deploy ApplicationSets
- [ ] Verify first application

### Per Customer
- [ ] Create customer directory
- [ ] Add metadata.yaml
- [ ] Add products.yaml
- [ ] Configure product values
- [ ] Encrypt secrets
- [ ] Add Terraform configs (if needed)
- [ ] Commit and push
- [ ] Verify deployment

### Per Product
- [ ] Create Helm chart
- [ ] Add base values
- [ ] Create JSON schema
- [ ] Add environment defaults
- [ ] Enable for customers
- [ ] Test deployment

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-04  
**Maintained By**: DevOps Team

For questions or issues, refer to the specific documentation files above.
