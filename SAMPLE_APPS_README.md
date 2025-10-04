# ArgoCD Sample Applications

Scripts to deploy sample Helm-based applications to your local ArgoCD instance for testing Config Hub integration.

---

## 📦 What Gets Deployed

### 6 Lightweight Applications

1. **nginx-ingress** (Infrastructure)
   - Ingress controller for routing
   - Chart: kubernetes/ingress-nginx
   - Resources: 100m CPU, 128Mi RAM

2. **metrics-server** (Monitoring)
   - Cluster metrics collection
   - Chart: kubernetes-sigs/metrics-server
   - Resources: 50m CPU, 64Mi RAM

3. **redis** (Database)
   - In-memory data store
   - Chart: helm/stable/redis
   - Resources: 50m CPU, 64Mi RAM
   - Customer: acme-corp

4. **grafana** (Monitoring)
   - Visualization dashboard
   - Chart: grafana/grafana
   - Resources: 100m CPU, 128Mi RAM
   - Customer: acme-corp
   - Default password: admin123

5. **prometheus** (Monitoring)
   - Metrics collection
   - Chart: prometheus-community/prometheus
   - Resources: 100m CPU, 256Mi RAM

6. **cert-manager** (Infrastructure)
   - Certificate management
   - Chart: jetstack/cert-manager
   - Resources: 50m CPU, 64Mi RAM

**Total Resources**: ~450m CPU, ~632Mi RAM

---

## 🚀 Quick Start

### Option 1: Individual Applications (Bash)

```bash
# Make script executable
chmod +x deploy-sample-apps.sh

# Deploy with defaults
./deploy-sample-apps.sh

# Or with custom parameters
./deploy-sample-apps.sh argocd demo-apps "microk8s kubectl"
```

### Option 2: ApplicationSet (Bash)

```bash
# Make script executable
chmod +x deploy-sample-appset.sh

# Deploy ApplicationSet
./deploy-sample-appset.sh

# Or with custom parameters
./deploy-sample-appset.sh argocd demo-apps "microk8s kubectl"
```

### Option 3: PowerShell (Windows + WSL)

```powershell
# Deploy with WSL/MicroK8s
.\deploy-sample-apps.ps1

# Deploy with native kubectl
.\deploy-sample-apps.ps1 -UseWSL:$false

# Custom parameters
.\deploy-sample-apps.ps1 -ArgoCDNamespace "argocd" -TargetNamespace "demo-apps"
```

---

## 📋 Script Parameters

### Bash Scripts

| Parameter | Default | Description |
|-----------|---------|-------------|
| `$1` | `argocd` | ArgoCD namespace |
| `$2` | `demo-apps` | Target namespace for applications |
| `$3` | `microk8s kubectl` | Kubectl command |

### PowerShell Script

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-ArgoCDNamespace` | `argocd` | ArgoCD namespace |
| `-TargetNamespace` | `demo-apps` | Target namespace for applications |
| `-UseWSL` | `$true` | Use WSL with MicroK8s |

---

## 🎯 What You'll See in Config Hub

After deployment, open Config Hub and navigate to the ArgoCD page. You'll see:

### Application List
- 6 applications with different statuses
- Color-coded health indicators
- Sync status badges

### Filtering Capabilities
- **By Product**: infrastructure, monitoring, database
- **By Customer**: demo, acme-corp
- **By Version**: Various versions
- **By Status**: Synced, OutOfSync, Healthy, etc.

### Application Details
- Click any application to see:
  - Source repository and chart
  - Destination cluster and namespace
  - Current parameters
  - Resource status
  - Logs and events

---

## 🔍 Verification

### Check Applications in ArgoCD CLI

```bash
# List all applications
argocd app list

# Get specific application
argocd app get nginx-ingress

# Check sync status
argocd app sync nginx-ingress --dry-run
```

### Check Applications in Kubernetes

```bash
# List applications (CRDs)
wsl microk8s kubectl get applications -n argocd

# Check ApplicationSet (if used)
wsl microk8s kubectl get applicationset -n argocd

# Check deployed resources
wsl microk8s kubectl get all -n demo-apps
```

### Check in Config Hub

1. **Open Config Hub**
2. **Go to ArgoCD page**
3. **You should see**:
   - 6 applications listed
   - Various sync/health statuses
   - Different products and customers
   - Ability to filter and search

---

## 🎨 Testing Config Hub Features

### 1. Search and Filter

```
Product Name: monitoring
→ Should show: metrics-server, grafana, prometheus

Customer Name: acme-corp
→ Should show: redis, grafana

Version: 1.0.0
→ Should show: nginx-ingress, metrics-server

Sync Status: Synced
→ Should show all synced applications

Health Status: Healthy
→ Should show all healthy applications
```

### 2. Application Details

Click on any application to test:
- ✅ View application details
- ✅ See source repository
- ✅ Check destination cluster
- ✅ View parameters
- ✅ Check resource status
- ✅ View logs
- ✅ See events

### 3. Application Operations

Test these operations:
- ✅ Refresh application
- ✅ Sync application
- ✅ Dry run sync
- ✅ View diff

---

## 🧹 Cleanup

### Remove Individual Applications

```bash
# Using bash
wsl microk8s kubectl delete -f argocd-sample-apps/

# Using PowerShell
wsl microk8s kubectl delete -f argocd-sample-apps/
```

### Remove ApplicationSet

```bash
# This will remove all applications managed by the ApplicationSet
wsl microk8s kubectl delete -f argocd-applicationset.yaml
```

### Remove Namespace

```bash
wsl microk8s kubectl delete namespace demo-apps
```

---

## 🔧 Customization

### Modify Application Parameters

Edit the generated YAML files in `argocd-sample-apps/` directory:

```yaml
helm:
  parameters:
    - name: replicas
      value: "2"  # Change from 1 to 2
    - name: resources.requests.cpu
      value: "200m"  # Increase CPU
```

Then reapply:
```bash
wsl microk8s kubectl apply -f argocd-sample-apps/nginx-ingress.yaml
```

### Add More Applications

Add to the script or create new YAML files following the same pattern:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  labels:
    app.kubernetes.io/name: my-app
    product: my-product
    customer: my-customer
    version: "1.0.0"
spec:
  project: default
  source:
    repoURL: https://charts.example.com
    chart: my-chart
    targetRevision: 1.0.0
    helm:
      parameters:
        - name: replicas
          value: "1"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## 🐛 Troubleshooting

### Applications Not Appearing in Config Hub

1. **Check ArgoCD connection**:
   ```bash
   argocd app list
   ```

2. **Verify Config Hub settings**:
   - Go to Settings → ArgoCD
   - Test connection
   - Check credentials

3. **Check application status**:
   ```bash
   wsl microk8s kubectl get applications -n argocd
   ```

### Applications Stuck in "Progressing"

This is normal for initial deployment. Wait a few minutes for:
- Images to be pulled
- Pods to start
- Health checks to pass

### Sync Errors

Check application logs:
```bash
argocd app logs <app-name>
```

Or in Config Hub:
- Click on the application
- View logs tab
- Check events tab

### Resource Constraints

If applications fail due to resources:
1. Check cluster resources:
   ```bash
   wsl microk8s kubectl top nodes
   wsl microk8s kubectl top pods -n demo-apps
   ```

2. Reduce resource requests in manifests
3. Deploy fewer applications

---

## 📊 Application Labels

All applications include these labels for filtering:

| Label | Purpose | Example Values |
|-------|---------|----------------|
| `app.kubernetes.io/name` | Application name | nginx-ingress, redis |
| `product` | Product category | infrastructure, monitoring, database |
| `customer` | Customer/tenant | demo, acme-corp |
| `version` | Application version | 1.0.0, 7.0.0, 10.0.0 |

Use these in Config Hub filters to test the search functionality!

---

## 🔄 Auto-Refresh Behavior

Config Hub automatically polls the ArgoCD API to keep application status up-to-date:

- **Polling Interval**: Configurable (default: 30 seconds)
- **Configuration**: Settings → ArgoCD → Auto-Refresh (5-300 seconds)
- **API Endpoint**: GET /applications
- **What Updates**: Sync status, health status, and all application metadata
- **Manual Refresh**: Click the Refresh button anytime for immediate update
- **Performance**: Lightweight polling with minimal overhead

**Adjusting the Interval:**
- Lower values (5-15 seconds): More responsive, higher API load
- Default (30 seconds): Balanced responsiveness and performance
- Higher values (60-300 seconds): Reduced API load, less frequent updates

This ensures you always see current application states without manual intervention.

---

## 🎓 Learning Opportunities

These sample applications are perfect for:

1. **Testing Config Hub Features**
   - Search and filter
   - Application details
   - Logs and events
   - Sync operations

2. **Understanding ArgoCD**
   - Application CRDs
   - Sync policies
   - Health checks
   - GitOps workflow

3. **Exploring Helm Charts**
   - Chart repositories
   - Parameter overrides
   - Values customization

4. **Kubernetes Concepts**
   - Namespaces
   - Resources
   - Labels and selectors
   - Deployments and services

---

## 📚 Additional Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Helm Charts](https://artifacthub.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Config Hub ArgoCD Guide](ARGOCD_README.md)

---

## ✨ Summary

These scripts provide:
- ✅ 6 lightweight sample applications
- ✅ Realistic labels for filtering
- ✅ Multiple products and customers
- ✅ Automated sync policies
- ✅ Easy deployment and cleanup
- ✅ Perfect for testing Config Hub

Deploy them and start exploring your ArgoCD integration! 🚀
