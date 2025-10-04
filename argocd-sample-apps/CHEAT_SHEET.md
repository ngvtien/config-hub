# Quick Reference Cheat Sheet

## 🚀 Initial Setup (One-Time)

**⚠️ IMPORTANT**: Replace `localhost` with your machine's IP address (e.g., 192.168.1.100)!

```bash
# 0. Find your IP address
# Windows: ipconfig
# Linux/Mac: hostname -I

# 1. Register repos with ArgoCD (CRITICAL STEP!)
# Replace YOUR_IP with your actual IP address!
argocd repo add http://YOUR_IP:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <token>

argocd repo add http://YOUR_IP:7990/scm/test/customer-configs.git \
  --username <user> --password <token>

# 2. Verify repos
argocd repo list

# 3. Deploy ApplicationSet
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml

# 4. Watch apps being created
kubectl get applications -n argocd -w
```

## 📁 Repository URLs

**⚠️ Replace `localhost` with your IP address (e.g., 192.168.1.100)**

- **Bitbucket**: `http://YOUR_IP:7990/TEST`
- **platform-infrastructure**: `http://YOUR_IP:7990/scm/test/platform-infrastructure.git`
- **customer-configs**: `http://YOUR_IP:7990/scm/test/customer-configs.git`

## 🆕 Add New Customer

```bash
cd customer-configs

# Create structure
mkdir -p customers/customer-XX/{product-a/environments,terraform,configs}

# Add files
cat > customers/customer-XX/metadata.yaml <<EOF
customer: customer-XX
name: "Company Name"
tier: standard
region: us-east-1
EOF

cat > customers/customer-XX/products.yaml <<EOF
customer: customer-XX
products:
  - name: product-a
    enabled: true
    version: "1.0.0"
EOF

cat > customers/customer-XX/product-a/values.yaml <<EOF
replicaCount: 2
image:
  tag: "1.0.0"
EOF

# Commit and push
git add customers/customer-XX
git commit -m "Add customer-XX"
git push

# Application auto-created in ~30 seconds!
```

## 🎯 Add New Product

```bash
# In platform-infrastructure
cd platform-infrastructure
mkdir -p products/product-X/templates
# Add Helm chart files

# In customer-configs
cd customer-configs
mkdir -p products/product-X/environments
# Add base-values.yaml

# Enable for customer
mkdir -p customers/customer-01/product-X
# Add values.yaml
```

## 🔍 Diagnostic Commands

```bash
# Check repos registered
argocd repo list

# Check ApplicationSets
kubectl get applicationsets -n argocd

# Check applications
kubectl get applications -n argocd

# Check specific app
kubectl get application customer-01-product-a -n argocd

# View logs
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=50

# Sync app
argocd app sync customer-01-product-a
```

## 🐛 Troubleshooting

### Application NotFound Error
```bash
# 1. Check repos (MOST COMMON!)
argocd repo list

# 2. Add if missing (use YOUR IP, not localhost!)
argocd repo add http://YOUR_IP:7990/scm/test/customer-configs.git \
  --username <user> --password <token>

# 3. Check logs
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=50

# 4. Verify file structure
cd customer-configs
find customers -name "values.yaml"
```

### Repo Authentication Failed or Connection Refused
```bash
# If you see "connection refused", use your IP instead of localhost!
# Find IP: ipconfig (Windows) or hostname -I (Linux/Mac)

# Test connectivity
argocd repo get http://YOUR_IP:7990/scm/test/customer-configs.git

# Re-add with correct credentials and IP
argocd repo rm http://YOUR_IP:7990/scm/test/customer-configs.git
argocd repo add http://YOUR_IP:7990/scm/test/customer-configs.git \
  --username <user> --password <token>
```

### No Apps Generated
```bash
# Check ApplicationSet status
kubectl describe applicationset product-customer-deployments -n argocd

# Verify file pattern matches
# ApplicationSet looks for: customers/*/*/values.yaml
# You need: customers/customer-01/product-a/values.yaml

# Force refresh
kubectl delete applicationset product-customer-deployments -n argocd
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml
```

## 📂 File Structure

```
customer-configs/
├── customers/
│   └── customer-01/
│       ├── metadata.yaml          # Customer info
│       ├── products.yaml          # Enabled products
│       ├── product-a/
│       │   ├── values.yaml        # Helm values
│       │   ├── secrets.yaml       # Encrypted
│       │   └── environments/      # Per-env
│       ├── terraform/             # IaC
│       └── configs/               # Other
├── products/
│   └── product-a/
│       ├── base-values.yaml       # Defaults
│       └── environments/          # Env defaults
└── shared/

platform-infrastructure/
├── applicationsets/               # ApplicationSets
├── products/
│   └── product-a/                 # Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
└── base-manifests/
```

## 🔄 Value Merge Order

1. `products/product-a/base-values.yaml` (base)
2. `products/product-a/environments/prod.yaml` (env)
3. `customers/customer-01/product-a/values.yaml` (customer)
4. `customers/customer-01/product-a/environments/prod.yaml` (customer+env)

## 📋 ApplicationSet Files

- **11** - Product-customer matrix (main pattern)
- **12** - Multi-environment (dev/staging/prod)
- **13** - Subscription-based
- **14** - With secrets
- **15** - Terraform infrastructure

## 🔐 Security

```bash
# Encrypt secrets with SOPS
sops --encrypt secrets.yaml > secrets.enc.yaml

# Or use Sealed Secrets
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml

# Or use Vault
# Add vault annotations to secrets
```

## 📊 Monitoring

```bash
# Application health
argocd app list

# Sync status
argocd app get customer-01-product-a

# Recent events
kubectl get events -n customer-01-product-a --sort-by='.lastTimestamp'
```

## 🔗 Documentation

- **START**: [QUICK_START.md](QUICK_START.md)
- **HELP**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **REFERENCE**: [README_APPLICATIONSETS.md](README_APPLICATIONSETS.md)
- **INDEX**: [INDEX.md](INDEX.md)

---

**Remember**: Always register repos with ArgoCD first! 🎯
