# Quick Deploy Reference

## 🚀 One-Line Deploy

### Bash (WSL)
```bash
chmod +x deploy-sample-apps.sh && ./deploy-sample-apps.sh
```

### PowerShell (Windows)
```powershell
.\deploy-sample-apps.ps1
```

---

## 📦 What Gets Deployed

| # | App | Type | Resources | Customer |
|---|-----|------|-----------|----------|
| 1 | nginx-ingress | Infrastructure | 100m/128Mi | demo |
| 2 | metrics-server | Monitoring | 50m/64Mi | demo |
| 3 | redis | Database | 50m/64Mi | acme-corp |
| 4 | grafana | Monitoring | 100m/128Mi | acme-corp |
| 5 | prometheus | Monitoring | 100m/256Mi | demo |
| 6 | cert-manager | Infrastructure | 50m/64Mi | demo |

**Total**: ~450m CPU, ~632Mi RAM

---

## ✅ Verify

```bash
# Check applications
argocd app list

# Check in Kubernetes
wsl microk8s kubectl get applications -n argocd

# Check deployed pods
wsl microk8s kubectl get pods -n demo-apps
```

---

## 🧹 Cleanup

```bash
# Remove applications
wsl microk8s kubectl delete -f argocd-sample-apps/

# Remove namespace
wsl microk8s kubectl delete namespace demo-apps
```

---

## 🎯 Test in Config Hub

1. Open Config Hub
2. Go to ArgoCD page
3. See 6 applications
4. Try filters:
   - Product: `monitoring`
   - Customer: `acme-corp`
   - Version: `1.0.0`

---

## 📖 Full Documentation

See [SAMPLE_APPS_README.md](SAMPLE_APPS_README.md) for complete guide.
