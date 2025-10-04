# Troubleshooting Guide

Common issues and solutions for the multi-customer GitOps setup.

## Issue 1: Application Not Found (NotFound Error)

### Symptom
```bash
kubectl get application customer-01-product-a -n argocd
# Error: applications.argoproj.io "customer-01-product-a" not found
```

### Root Cause
Git repositories are not registered with ArgoCD, so ApplicationSets cannot access them to generate applications.

### Solution

**Step 1: Check if repositories are registered**
```bash
argocd repo list
```

If the list is empty or missing your repos, proceed to Step 2.

**Step 2: Register repositories**
```bash
# Add platform-infrastructure repo
argocd repo add http://localhost:7990/scm/test/platform-infrastructure.git \
  --username <your-bitbucket-username> \
  --password <your-bitbucket-password>

# Add customer-configs repo
argocd repo add http://localhost:7990/scm/test/customer-configs.git \
  --username <your-bitbucket-username> \
  --password <your-bitbucket-password>
```

**Step 3: Verify connectivity**
```bash
# Check repo status
argocd repo get http://localhost:7990/scm/test/customer-configs.git

# Should show: CONNECTION STATUS: Successful
```

**Step 4: Wait for ApplicationSet to generate apps**
```bash
# Watch for applications to be created (may take 30-60 seconds)
kubectl get applications -n argocd -w

# Check ApplicationSet controller logs
kubectl logs -n argocd deployment/argocd-applicationset-controller -f
```

**Step 5: Force refresh if needed**
```bash
# Delete and recreate ApplicationSet
kubectl delete applicationset product-customer-deployments -n argocd
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml
```

---

## Issue 2: Connection Refused to localhost:7990

### Symptom
```bash
argocd repo add http://localhost:7990/scm/test/customer-configs.git ...
# Error: dial tcp [::1]:7990: connect: connection refused
```

### Root Cause
ArgoCD runs inside Kubernetes. From inside the cluster, `localhost` refers to the pod itself, not your host machine where Bitbucket is running.

### Solutions

**Option A: Use Host IP Address (Recommended)**
```bash
# Find your machine's IP address
# Windows:
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)

# Linux/Mac:
hostname -I
# or
ip addr show

# Then use your IP instead of localhost:
argocd repo add http://192.168.1.100:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>

argocd repo add http://192.168.1.100:7990/scm/test/customer-configs.git \
  --username <user> --password <pass>
```

**Option B: Use host.docker.internal (Docker Desktop only)**
```bash
argocd repo add http://host.docker.internal:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>
```

**Option C: Use External Hostname**
```bash
# If Bitbucket has a hostname/DNS entry:
argocd repo add http://bitbucket.example.com:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>
```

**Option D: Bitbucket in Same Cluster**
```bash
# If Bitbucket is running in Kubernetes:
argocd repo add http://bitbucket.default.svc.cluster.local:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>
```

**After changing URL, update ApplicationSets:**
```bash
# Edit all ApplicationSet files to use the new URL
# Change: http://localhost:7990/scm/test/...
# To: http://192.168.1.100:7990/scm/test/...

# Then reapply:
kubectl apply -f applicationsets/11-product-customer-matrix-set.yaml
kubectl apply -f applicationsets/12-product-by-environment-set.yaml
```

---

## Issue 3: Repository Authentication Failed

### Symptom
```bash
argocd repo list
# Shows: CONNECTION STATUS: Failed (after connection succeeds)
```

### Solutions

**Option A: Use Personal Access Token (Recommended)**
```bash
# Create token in Bitbucket: Settings → Personal Access Tokens
# Then add repo with token:
argocd repo add http://localhost:7990/scm/test/customer-configs.git \
  --username <your-username> \
  --password <your-personal-access-token>
```

**Option B: Use SSH Key**
```bash
# Add SSH key to Bitbucket
# Then add repo:
argocd repo add git@localhost:7990/scm/test/customer-configs.git \
  --ssh-private-key-path ~/.ssh/id_rsa
```

**Option C: Add via kubectl Secret**
```bash
cat <<EOF | kubectl apply -f -
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
  username: <your-username>
  password: <your-password>
EOF
```

---

## Issue 4: ApplicationSet Not Generating Applications

### Symptom
ApplicationSet exists but no applications are created.

### Diagnosis

**Check ApplicationSet status**
```bash
kubectl describe applicationset product-customer-deployments -n argocd
```

**Check controller logs**
```bash
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=100
```

### Common Causes & Solutions

**Cause 1: File pattern doesn't match**
```bash
# ApplicationSet 11 looks for: customers/*/*/values.yaml
# Verify your structure:
cd customer-configs
find customers -name "values.yaml"

# Should output:
# customers/customer-01/product-a/values.yaml
# customers/customer-01/product-b/values.yaml
# etc.
```

**Cause 2: Git repo not accessible**
```bash
# Test git access
git ls-remote http://localhost:7990/scm/test/customer-configs.git

# If fails, check credentials
argocd repo get http://localhost:7990/scm/test/customer-configs.git
```

**Cause 3: Wrong branch**
```bash
# ApplicationSet uses 'main' branch by default
# Check your default branch:
cd customer-configs
git branch

# If using 'master' instead of 'main', update ApplicationSet:
# Change: revision: main
# To: revision: master
```

---

## Issue 4: Values Not Being Applied

### Symptom
Application deploys but uses wrong values.

### Diagnosis

**Test Helm template locally**
```bash
cd platform-infrastructure
helm template test-release ./products/product-a \
  -f ../customer-configs/products/product-a/base-values.yaml \
  -f ../customer-configs/customers/customer-01/product-a/values.yaml
```

### Solutions

**Check value file paths in ApplicationSet**
```bash
kubectl get applicationset product-customer-deployments -n argocd -o yaml

# Verify valueFiles paths are correct:
# - $values/products/{{path[2]}}/base-values.yaml
# - $values/customers/{{path[1]}}/{{path[2]}}/values.yaml
```

**Check if files exist in repo**
```bash
cd customer-configs
ls -la products/product-a/base-values.yaml
ls -la customers/customer-01/product-a/values.yaml
```

---

## Issue 5: Secrets Not Decrypting

### Symptom
Application fails to sync with secret-related errors.

### Solutions

**For SOPS:**
```bash
# Verify SOPS is configured
kubectl get secret -n argocd sops-age-key

# Test decryption locally
cd customer-configs
sops -d customers/customer-01/product-a/secrets.yaml
```

**For Sealed Secrets:**
```bash
# Verify sealed-secrets controller is running
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# Check certificate
kubeseal --fetch-cert
```

**For Vault:**
```bash
# Verify argocd-vault-plugin is installed
kubectl get cm argocd-cm -n argocd -o yaml | grep vault

# Check Vault connectivity
kubectl exec -it deployment/argocd-repo-server -n argocd -- \
  vault status
```

---

## Issue 6: Sync Failures

### Symptom
Application shows "OutOfSync" or sync errors.

### Diagnosis

**Check application status**
```bash
argocd app get customer-01-product-a

# Or via kubectl
kubectl describe application customer-01-product-a -n argocd
```

**View sync errors**
```bash
argocd app logs customer-01-product-a
```

### Solutions

**Manual sync**
```bash
argocd app sync customer-01-product-a
```

**Hard refresh**
```bash
argocd app sync customer-01-product-a --force --prune
```

**Check resource quotas**
```bash
kubectl describe namespace customer-01-product-a
```

---

## Issue 7: Namespace Already Exists Error

### Symptom
Sync fails with "namespace already exists" error.

### Solution

**Add to ApplicationSet syncOptions**
```yaml
syncPolicy:
  syncOptions:
    - CreateNamespace=true
```

Or create namespace manually:
```bash
kubectl create namespace customer-01-product-a
```

---

## Issue 8: Multiple Applications for Same Customer-Product

### Symptom
Duplicate applications created.

### Cause
Multiple ApplicationSets matching the same files.

### Solution

**Check all ApplicationSets**
```bash
kubectl get applicationsets -n argocd
```

**Review generator patterns**
```bash
# Ensure patterns don't overlap
kubectl get applicationset -n argocd -o yaml | grep -A 5 "path:"
```

---

## Diagnostic Commands

### Quick Health Check
```bash
# Check all components
echo "=== Repositories ==="
argocd repo list

echo "=== ApplicationSets ==="
kubectl get applicationsets -n argocd

echo "=== Applications ==="
kubectl get applications -n argocd

echo "=== Recent Controller Logs ==="
kubectl logs -n argocd deployment/argocd-applicationset-controller --tail=20
```

### Detailed Investigation
```bash
# Full ApplicationSet details
kubectl get applicationset product-customer-deployments -n argocd -o yaml

# Application details
kubectl get application customer-01-product-a -n argocd -o yaml

# Controller logs with timestamps
kubectl logs -n argocd deployment/argocd-applicationset-controller \
  --timestamps --tail=100

# Test git access from ArgoCD
kubectl run -it --rm git-test --image=alpine/git -n argocd -- \
  git ls-remote http://localhost:7990/scm/test/customer-configs.git
```

---

## Prevention Checklist

Before deploying ApplicationSets:

- [ ] Git repositories created in Bitbucket
- [ ] Repositories registered with ArgoCD (`argocd repo list`)
- [ ] Repository connectivity verified (`argocd repo get <url>`)
- [ ] File structure matches generator patterns
- [ ] Values files exist and are valid YAML
- [ ] Secrets are properly encrypted
- [ ] ApplicationSet YAML is valid (`kubectl apply --dry-run=client`)
- [ ] ArgoCD has necessary RBAC permissions

---

## Getting Help

### Check Logs
```bash
# ApplicationSet controller
kubectl logs -n argocd deployment/argocd-applicationset-controller -f

# Application controller
kubectl logs -n argocd deployment/argocd-application-controller -f

# Repo server
kubectl logs -n argocd deployment/argocd-repo-server -f
```

### Useful Resources
- [ArgoCD Troubleshooting](https://argo-cd.readthedocs.io/en/stable/operator-manual/troubleshooting/)
- [ApplicationSet Troubleshooting](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Troubleshooting/)
- Check `QUICK_START.md` for setup steps
- Check `README_APPLICATIONSETS.md` for detailed documentation

---

**Last Updated**: 2025-10-04
