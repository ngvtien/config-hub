# ArgoCD Integration Guide

Complete guide for setting up and using ArgoCD integration in Config Hub.

---

## 🚀 Quick Start

### For Windows + WSL + MicroK8s Users

Choose the easiest method for you:

#### Option 1: Username/Password (No Setup Required) ⭐ Recommended for Local Dev

1. **Open Config Hub → Settings → ArgoCD**
2. **Fill in**:
   ```
   Configuration Name: Local ArgoCD
   Server URL: https://argocd.k8s.local
   Username: admin
   Password: <your-password>
   Namespace: argocd
   ```
3. **Click "Test Connection"** ✅
4. **Click "Save Configuration"** ✅
5. **Done!** Go to ArgoCD page to see your applications

#### Option 2: Service Account Token (5 minutes) ⭐ Recommended for Production

**Using Bash Script (Easiest):**
```bash
# 1. Login from Windows PowerShell
argocd login argocd.k8s.local --username admin --password <password> --insecure

# 2. Run script in WSL
cd /mnt/c/repos/github/config-hub/skeleton
chmod +x setup-argocd-account.sh
./setup-argocd-account.sh
```

**Using PowerShell Script:**
```powershell
# 1. Login to ArgoCD
argocd login argocd.k8s.local --username admin --password <password> --insecure

# 2. Run WSL-aware script
.\setup-argocd-account-wsl.ps1
```

**Manual Commands:**
```powershell
# 1. Login
argocd login argocd.k8s.local --username admin --password <password> --insecure

# 2. Create account
wsl microk8s kubectl patch configmap argocd-cm -n argocd --type merge -p '{\"data\":{\"accounts.config-hub\":\"apiKey\",\"accounts.config-hub.enabled\":\"true\"}}'

# 3. Restart ArgoCD
wsl microk8s kubectl rollout restart deployment argocd-server -n argocd
wsl microk8s kubectl rollout status deployment argocd-server -n argocd

# 4. Wait
Start-Sleep -Seconds 10

# 5. Set password
argocd account update-password --account config-hub --new-password ConfigHub2025!

# 6. Set permissions
wsl microk8s kubectl patch configmap argocd-rbac-cm -n argocd --type merge -p '{\"data\":{\"policy.csv\":\"g, config-hub, role:admin\\n\"}}'

# 7. Restart again
wsl microk8s kubectl rollout restart deployment argocd-server -n argocd
wsl microk8s kubectl rollout status deployment argocd-server -n argocd

# 8. Generate token
Start-Sleep -Seconds 10
argocd account generate-token --account config-hub
```

---

## 📖 Features

### Authentication Methods

#### 1. Username/Password
- ✅ No setup required
- ✅ Auto-generates session tokens
- ✅ Perfect for local development
- ⚠️ Tokens expire after ~24 hours

#### 2. Service Account Token
- ✅ More secure for production
- ✅ Can set custom expiration
- ✅ Trackable and revocable
- ✅ Better for team environments

#### 3. Admin Token
- ✅ Quick for testing
- ⚠️ Requires enabling apiKey capability
- ⚠️ Not recommended for production

### UI Features

- ✅ **Test Connection** - Validates server and credentials
- ✅ **Save Configuration** - Securely stores credentials
- ✅ **Password Visibility Toggle** - Eye icon to show/hide passwords
- ✅ **Real-time Status** - Success/error feedback
- ✅ **Credential Tracking** - Displays credential ID

### Security Features

- ✅ **OS-Level Encryption** - Uses Windows DPAPI
- ✅ **No Plain Text Storage** - All credentials encrypted
- ✅ **Secure IPC** - Credentials only via IPC channels
- ✅ **File Permissions** - Restricted to owner only (0o600)
- ✅ **SSL/TLS Support** - Works with self-signed certificates

---

## 👁️ Password Visibility Feature

### How It Works
- **Eye icon** appears when you enter a password or token
- **Click to toggle** between showing and hiding
- **Useful for** verifying pasted tokens and checking for typos

### Security
The visibility toggle is **UI-only**:
- ✅ Credentials still encrypted when saved
- ✅ Not logged to console
- ✅ Transmitted securely via IPC
- ✅ Stored with OS-level encryption

### Best Practices
- ✅ Use to verify entries before saving
- ✅ Hide before screen sharing
- ⚠️ Don't leave visible in public spaces

---

## 🔧 Configuration

### Settings Page Fields

| Field | Required | Description |
|-------|----------|-------------|
| **Configuration Name** | Yes | Friendly name for this configuration |
| **Server URL** | Yes | ArgoCD server URL (e.g., `https://argocd.k8s.local`) |
| **Auth Token** | * | Bearer token from ArgoCD |
| **Username** | * | ArgoCD username (if using password auth) |
| **Password** | * | ArgoCD password (if using password auth) |
| **Namespace** | No | ArgoCD namespace (default: `argocd`) |
| **Sync Policy** | No | Manual or Automatic |

\* Either provide **Auth Token** OR **Username + Password**

### Example Configurations

**Local Development:**
```yaml
Configuration Name: Local ArgoCD
Server URL: https://argocd.k8s.local
Username: admin
Password: <your-password>
Auth Token: (leave empty)
Namespace: argocd
Sync Policy: manual
```

**Production:**
```yaml
Configuration Name: Config Hub Service Account
Server URL: https://argocd.k8s.local
Username: (leave empty)
Password: (leave empty)
Auth Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Namespace: argocd
Sync Policy: manual
```

---

## 🐛 Troubleshooting

### Connection Test Fails

**Check server URL:**
- ✅ Correct: `https://argocd.k8s.local`
- ❌ Wrong: `https://argocd.k8s.local/` (trailing slash)
- ❌ Wrong: `https://argocd.k8s.local/api/v1`

**Verify credentials:**
```powershell
# Test with PowerShell
Invoke-RestMethod -Uri "https://argocd.k8s.local/api/v1/session" `
  -Method Post `
  -Body (@{username="admin";password="<password>"} | ConvertTo-Json) `
  -ContentType "application/json" `
  -SkipCertificateCheck
```

**Check ArgoCD is running:**
```powershell
wsl microk8s kubectl get pods -n argocd
```

### "kubectl not found" Error

You're running kubectl in WSL. Use:
```powershell
wsl microk8s kubectl <command>
```

Or use the WSL-aware script:
```powershell
.\setup-argocd-account-wsl.ps1
```

### "account does not have apiKey capability"

Enable apiKey for the account:
```powershell
wsl microk8s kubectl patch configmap argocd-cm -n argocd --type merge -p '{\"data\":{\"accounts.admin\":\"apiKey, login\"}}'
wsl microk8s kubectl rollout restart deployment argocd-server -n argocd
```

### Token Generation Fails

Wait 30 seconds after creating the account:
```powershell
Start-Sleep -Seconds 30
argocd account generate-token --account config-hub
```

### Permission Denied

Check RBAC configuration:
```powershell
wsl microk8s kubectl get configmap argocd-rbac-cm -n argocd -o yaml
```

Should include:
```yaml
data:
  policy.csv: |
    g, config-hub, role:admin
```

---

## 📊 Comparison Matrix

| Feature | Username/Password | Service Account | Admin Token |
|---------|------------------|-----------------|-------------|
| **Setup Time** | 0 minutes | 5 minutes | 2 minutes |
| **Security** | Medium | High | Medium |
| **Token Expiration** | ~24 hours | Configurable | Configurable |
| **Best For** | Local dev | Production | Quick testing |
| **Revocable** | No | Yes | Yes |
| **Trackable** | No | Yes | Yes |

---

## 🔐 Security Best Practices

### Token Management
- ✅ Set expiration dates (30-90 days)
- ✅ Rotate tokens regularly
- ✅ Revoke unused tokens
- ✅ Use meaningful token IDs

### Account Management
- ✅ Create dedicated service accounts
- ✅ Use least privilege permissions
- ✅ Don't share admin credentials
- ✅ Enable RBAC policies

### Credential Storage
- ✅ All credentials encrypted at rest
- ✅ OS-level encryption (DPAPI)
- ✅ Secure file permissions
- ✅ No plain text anywhere

---

## 📚 Quick Commands Reference

### ArgoCD Commands (Windows PowerShell)
```powershell
# List accounts
argocd account list

# Get account details
argocd account get --account config-hub

# Generate token
argocd account generate-token --account config-hub

# Generate token with expiration (90 days)
argocd account generate-token --account config-hub --expires-in 2160h

# Delete token
argocd account delete-token --account config-hub --id token-id
```

### Kubernetes Commands (WSL)
```powershell
# Check ConfigMaps
wsl microk8s kubectl get configmap argocd-cm -n argocd -o yaml
wsl microk8s kubectl get configmap argocd-rbac-cm -n argocd -o yaml

# Check pods
wsl microk8s kubectl get pods -n argocd

# Check logs
wsl microk8s kubectl logs -n argocd deployment/argocd-server --tail=50

# Restart ArgoCD
wsl microk8s kubectl rollout restart deployment argocd-server -n argocd
```

---

## 📖 Additional Resources

- [ArgoCD Official Documentation](https://argo-cd.readthedocs.io/)
- [ArgoCD API Documentation](https://argo-cd.readthedocs.io/en/stable/developer-guide/api-docs/)
- [ArgoCD RBAC Configuration](https://argo-cd.readthedocs.io/en/stable/operator-manual/rbac/)

---

## ✨ Summary

Config Hub provides **secure, flexible ArgoCD integration** with:

1. ✅ Multiple authentication methods
2. ✅ OS-level credential encryption
3. ✅ Password visibility toggle for convenience
4. ✅ WSL/MicroK8s support
5. ✅ Automated setup scripts
6. ✅ Production-ready security

Choose your preferred authentication method and start managing your ArgoCD applications! 🚀
