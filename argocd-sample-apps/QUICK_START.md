# Quick Start Guide: Multi-Customer GitOps Setup

## Overview

This setup manages 20+ customers across multiple products using two Git repositories on Bitbucket Server.

## Repository Names

1. **platform-infrastructure** - Infrastructure code, Helm charts, ApplicationSets
2. **customer-configs** - Customer-specific values, secrets, Terraform configs

## Bitbucket URLs

- Project: `TEST` at `http://localhost:7990/TEST`
- Repo 1: `http://localhost:7990/scm/test/platform-infrastructure.git`
- Repo 2: `http://localhost:7990/scm/test/customer-configs.git`

## Quick Setup

### Step 1: Create Repositories on Bitbucket

```bash
# Navigate to http://localhost:7990/
# Create project "TEST" if it doesn't exist
# Create two repositories:
# 1. platform-infrastructure
# 2. customer-configs
```

### Step 2: Initialize customer-configs Repository

```bash
git clone http://localhost:7990/scm/test/customer-configs.git
cd customer-configs

# Create directory structure
mkdir -p customers/customer-01/{product-a/environments,product-b/environments,terraform,configs}
mkdir -p products/{product-a,product-b,product-c}/environments
mkdir -p shared/{terraform-modules,common-secrets}

# Create customer metadata
cat > customers/customer-01/metadata.yaml <<EOF
customer: customer-01
name: "Acme Corporation"
tier: premium
region: us-east-1
contact: ops@acme.example.com
EOF

# Create products list
cat > customers/customer-01/products.yaml <<EOF
customer: customer-01
products:
  - name: product-a
    enabled: true
    version: "1.0.0"
  - name: product-b
    enabled: true
    version: "1.0.0"
EOF

# Create product values
cat > customers/customer-01/product-a/values.yaml <<EOF
replicaCount: 2
image:
  tag: "1.0.0"
resources:
  requests:
    cpu: 100m
    memory: 128Mi
ingress:
  enabled: true
  host: acme.product-a.example.com
EOF

# Create product base values
cat > products/product-a/base-values.yaml <<EOF
replicaCount: 1
image:
  repository: myregistry/product-a
  tag: "1.0.0"
resources:
  requests:
    cpu: 50m
    memory: 64Mi
service:
  type: ClusterIP
  port: 80
EOF

# Create environment overrides
cat > products/product-a/environments/prod.yaml <<EOF
replicaCount: 3
resources:
  requests:
    cpu: 200m
    memory: 256Mi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
EOF

# Commit and push
git add .
git commit -m "Initial customer-configs structure"
git push origin main
```

### Step 3: Initialize platform-infrastructure Repository

```bash
git clone http://localhost:7990/scm/test/platform-infrastructure.git
cd platform-infrastructure

# Create directory structure
mkdir -p applicationsets
mkdir -p products/product-a/{templates,charts}
mkdir -p base-manifests

# Create Helm Chart.yaml
cat > products/product-a/Chart.yaml <<EOF
apiVersion: v2
name: product-a
description: Product A Application
type: application
version: 1.0.0
appVersion: "1.0.0"
EOF

# Create Helm values.yaml
cat > products/product-a/values.yaml <<EOF
replicaCount: 1
image:
  repository: nginx
  tag: "latest"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
resources:
  requests:
    cpu: 50m
    memory: 64Mi
EOF

# Create deployment template
cat > products/product-a/templates/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
      - name: app
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: 80
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
EOF

# Create service template
cat > products/product-a/templates/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: 80
  selector:
    app: {{ .Release.Name }}
EOF

# Copy ApplicationSets from samples
# (Assuming you're in the repo with argocd-sample-apps/)
cp ../argocd-sample-apps/11-product-customer-matrix-set.yaml applicationsets/
cp ../argocd-sample-apps/12-product-by-environment-set.yaml applicationsets/
cp ../argocd-sample-apps/14-customer-with-secrets-set.yaml applicationsets/

# Commit and push
git add .
git commit -m "Initial platform-infrastructure setup"
git push origin main
```

### Step 4: Register Git Repositories with ArgoCD

Before deploying ApplicationSets, ArgoCD needs access to your Git repositories.

**⚠️ IMPORTANT**: Replace `localhost` with your machine's IP address! ArgoCD runs inside Kubernetes and cannot access `localhost`.

```bash
# Find your machine's IP address first:
# Windows: ipconfig (look for IPv4 Address, e.g., 192.168.1.100)
# Linux/Mac: hostname -I

# Replace localhost with your actual IP address below!
# Add platform-infrastructure repository
argocd repo add http://YOUR_IP_ADDRESS:7990/scm/test/platform-infrastructure.git \
  --username <your-bitbucket-username> \
  --password <your-bitbucket-password> \
  --name platform-infrastructure

# Add customer-configs repository
argocd repo add http://YOUR_IP_ADDRESS:7990/scm/test/customer-configs.git \
  --username <your-bitbucket-username> \
  --password <your-bitbucket-password> \
  --name customer-configs

# Verify repositories are added
argocd repo list

# Alternative: Add repos via kubectl (if you prefer)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: platform-infrastructure-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: http://localhost:7990/scm/test/platform-infrastructure.git
  username: <your-bitbucket-username>
  password: <your-bitbucket-password>
---
apiVersion: v1
kind: Secret
metadata:
  name: customer-configs-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: http://localhost:7990/scm/test/customer-configs.git
  username: <your-bitbucket-username>
  password: <your-bitbucket-password>
EOF
```

**Note**: For production, use SSH keys or access tokens instead of passwords:

```bash
# Using SSH key
argocd repo add git@localhost:7990/scm/test/platform-infrastructure.git \
  --ssh-private-key-path ~/.ssh/id_rsa

# Using access token (recommended)
argocd repo add http://localhost:7990/scm/test/platform-infrastructure.git \
  --username <username> \
  --password <personal-access-token>
```

### Step 5: Update ApplicationSet URLs

**IMPORTANT**: Before deploying, update the ApplicationSet files to use your IP address instead of `localhost`.

**Option A: Use Helper Script (Easiest)**
```bash
# Windows PowerShell
cd argocd-sample-apps
.\update-repo-urls.ps1 -IpAddress 192.168.1.100

# Linux/Mac
cd argocd-sample-apps
chmod +x update-repo-urls.sh
./update-repo-urls.sh 192.168.1.100
```

**Option B: Manual Edit**
```bash
# Edit each ApplicationSet file and replace localhost with your IP
# In applicationsets/11-product-customer-matrix-set.yaml
# Change: http://localhost:7990/scm/test/...
# To: http://YOUR_IP_ADDRESS:7990/scm/test/...

# You need to update these lines in each ApplicationSet:
# - repoURL: http://localhost:7990/scm/test/customer-configs.git
# - repoURL: http://localhost:7990/scm/test/platform-infrastructure.git
```

### Step 6: Deploy ApplicationSets to ArgoCD

```bash
# Apply the ApplicationSets
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml

# Watch applications being created
kubectl get applications -n argocd -w

# Check ApplicationSet status
kubectl get applicationsets -n argocd

# Check ApplicationSet controller logs if no apps are created
kubectl logs -n argocd deployment/argocd-applicationset-controller -f
```

### Step 7: Verify Deployment

```bash
# List all applications
kubectl get applications -n argocd

# Check specific application
kubectl get application customer-01-product-a -n argocd -o yaml

# If application doesn't exist (NotFound error), troubleshoot:

# 1. Check ApplicationSet status
kubectl describe applicationset product-customer-deployments -n argocd

# 2. Check ApplicationSet controller logs
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=50

# 3. Verify repos are registered and accessible
argocd repo list

# 4. Test git access manually
git ls-remote http://localhost:7990/scm/test/customer-configs.git

# 5. Verify the file structure matches the generator pattern
# The ApplicationSet looks for: customers/*/*/val
# Make sure you have: customers/customer-01/product-a/valu

# View application in ArgoCD UI
# Navigate to http://localhost:8080 (or your ArgoCD URL)
```

## Adding More Customers

### Add Customer 02

```bash
cd customer-configs

# Create customer directory
mkdir -p customers/customer-02/{product-a/environments,terraform,configs}

# Create metadata
cat > customers/customer-02/metadata.yaml <<EOF
customer: customer-02
name: "TechCorp Inc"
tier: standard
region: us-west-2
contact: devops@techcorp.example.com
EOF

# Create products list
cat > customers/customer-02/products.yaml <<EOF
customer: customer-02
products:
  - name: product-a
    enabled: true
    version: "1.0.0"
EOF

# Create product values
cat > customers/customer-02/product-a/values.yaml <<EOF
replicaCount: 1
image:
  tag: "1.0.0"
resources:
  requests:
    cpu: 50m
    memory: 64Mi
ingress:
  enabled: true
  host: techcorp.product-a.example.com
EOF

# Commit and push
git add customers/customer-02
git commit -m "Add customer-02"
git push

# ArgoCD will automatically create the application!
```

## Adding More Products

### Add Product C

```bash
# In platform-infrastructure repo
cd platform-infrastructure
mkdir -p products/product-c/templates

# Create Helm chart files (similar to product-a)
# ... (Chart.yaml, values.yaml, templates/)

git add products/product-c
git commit -m "Add product-c"
git push

# In customer-configs repo
cd customer-configs
mkdir -p products/product-c/environments

# Create base values
cat > products/product-c/base-values.yaml <<EOF
replicaCount: 1
image:
  repository: myregistry/product-c
  tag: "1.0.0"
EOF

# Enable for customer-01
cat >> customers/customer-01/products.yaml <<EOF
  - name: product-c
    enabled: true
    version: "1.0.0"
EOF

# Create customer values
mkdir -p customers/customer-01/product-c
cat > customers/customer-01/product-c/values.yaml <<EOF
replicaCount: 2
EOF

git add .
git commit -m "Add product-c and enable for customer-01"
git push
```

## File Structure Summary

```
customer-configs/
├── customers/
│   ├── customer-01/
│   │   ├── metadata.yaml           ← Customer info
│   │   ├── products.yaml           ← Enabled products
│   │   ├── product-a/
│   │   │   ├── values.yaml         ← Customer-specific values
│   │   │   ├── secrets.yaml        ← Encrypted secrets
│   │   │   └── environments/       ← Per-env overrides
│   │   ├── terraform/              ← Customer infrastructure
│   │   └── configs/                ← Other configs
│   └── customer-02/...
├── products/
│   ├── product-a/
│   │   ├── base-values.yaml        ← Product defaults
│   │   └── environments/           ← Env defaults
│   └── product-b/...
└── shared/                         ← Shared resources

platform-infrastructure/
├── applicationsets/                ← ApplicationSet definitions
├── products/
│   ├── product-a/                  ← Helm chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   └── product-b/...
└── base-manifests/                 ← Base K8s manifests
```

## Common Operations

### View all customer applications
```bash
kubectl get applications -n argocd -l customer=customer-01
```

### Sync specific application
```bash
argocd app sync customer-01-product-a
```

### View application details
```bash
argocd app get customer-01-product-a
```

### Disable product for customer
```bash
# Edit customers/customer-01/products.yaml
# Set enabled: false for the product
git commit -am "Disable product-b for customer-01"
git push
```

### Update product version
```bash
# Edit customers/customer-01/product-a/values.yaml
# Update image.tag
git commit -am "Update customer-01 product-a to v1.2.0"
git push
```

## Troubleshooting

### Application not appearing (NotFound error)

**Most Common Cause**: Git repositories not registered with ArgoCD

```bash
# 1. Check if repos are registered
argocd repo list

# If empty or missing repos, add them:
argocd repo add http://localhost:7990/scm/test/platform-infrastructure.git \
  --username <username> --password <password>

argocd repo add http://localhost:7990/scm/test/customer-configs.git \
  --username <username> --password <password>

# 2. Verify repo connectivity
argocd repo get http://localhost:7990/scm/test/customer-configs.git

# 3. Check ApplicationSet controller logs
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=100

# 4. Verify file structure matches generator pattern
# ApplicationSet 11 looks for: customers/*/*/values.yaml
# You need: customers/customer-01/product-a/values.yaml

# 5. Check ApplicationSet status
kubectl describe applicationset product-customer-deployments -n argocd

# 6. Force ApplicationSet refresh
kubectl delete applicationset product-customer-deployments -n argocd
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml
```

### Repository authentication issues
```bash
# Test git access from ArgoCD namespace
kubectl run -it --rm git-test --image=alpine/git -n argocd -- \
  git ls-remote http://localhost:7990/scm/test/customer-configs.git

# Check repo secret
kubectl get secret -n argocd -l argocd.argoproj.io/secret-type=repository

# View repo connection status in UI
# ArgoCD UI → Settings → Repositories
```

### Values not being applied
```bash
# Test Helm template locally
helm template test-release ./products/product-a \
  -f products/product-a/base-values.yaml \
  -f customers/customer-01/product-a/values.yaml
```

### Sync failures
```bash
# View application events
kubectl describe application customer-01-product-a -n argocd

# Check application logs
argocd app logs customer-01-product-a
```

## Next Steps

1. Set up secret management (SOPS, Sealed Secrets, or Vault)
2. Configure CI/CD pipelines to update image tags
3. Add monitoring and alerting
4. Implement backup strategies
5. Set up RBAC for customer isolation
6. Add validation webhooks for schemas
7. Configure Terraform operator for infrastructure

## Resources

- See `README_APPLICATIONSETS.md` for detailed documentation
- See `EXAMPLE_customer-configs-structure.md` for full structure examples
- See `EXAMPLE_platform-infrastructure-structure.md` for infrastructure examples
