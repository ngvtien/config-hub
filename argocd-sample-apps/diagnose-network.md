# Network Connectivity Diagnosis

## Your Network Setup

From your `ipconfig`:
- **WSL IP**: 172.27.160.1 (Hyper-V/WSL2 network)
- **Ethernet IP**: 192.168.1.13 (Physical network)

## Where is Bitbucket Running?

First, let's confirm where Bitbucket is accessible:

```powershell
# Test from your Windows machine
curl http://localhost:7990
curl http://172.27.160.1:7990
curl http://192.168.1.13:7990
```

## Where is Kubernetes/ArgoCD Running?

### Option 1: Docker Desktop Kubernetes
If using Docker Desktop, use: **`host.docker.internal`**

```bash
argocd repo add http://host.docker.internal:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>
```

### Option 2: WSL2 Kubernetes (k3s, kind, minikube in WSL)
If Kubernetes is in WSL2, use: **`172.27.160.1`** (WSL host IP)

```bash
argocd repo add http://172.27.160.1:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>
```

### Option 3: External Kubernetes (separate VM or cloud)
Use your physical network IP: **`192.168.1.13`**

```bash
argocd repo add http://192.168.1.13:7990/scm/test/platform-infrastructure.git \
  --username <user> --password <pass>
```

## Diagnostic Steps

### Step 1: Find where Kubernetes is running

```powershell
# Check kubectl context
kubectl config current-context

# Common contexts:
# - docker-desktop → Use host.docker.internal
# - rancher-desktop → Use host.rancher-internal
# - minikube → Check minikube ip
# - kind → Use host IP
```

### Step 2: Test from inside a Kubernetes pod

```bash
# Run a test pod
kubectl run test-net --rm -i --restart=Never --image=curlimages/curl -n argocd -- sh

# Inside the pod, test each IP:
curl -v http://172.27.160.1:7990
curl -v http://192.168.1.13:7990
curl -v http://host.docker.internal:7990

# Exit the pod
exit
```

### Step 3: Check Windows Firewall

Bitbucket might be blocked by Windows Firewall for certain networks.

```powershell
# Check if port 7990 is listening
netstat -an | findstr 7990

# Should show: TCP    0.0.0.0:7990    LISTENING
# or:          TCP    [::]:7990       LISTENING
```

If Bitbucket is only listening on `127.0.0.1:7990`, it won't be accessible from Kubernetes!

### Step 4: Configure Bitbucket to listen on all interfaces

Check your Bitbucket configuration:

**File**: `<bitbucket-home>/shared/bitbucket.properties`

Add or modify:
```properties
server.address=0.0.0.0
server.port=7990
```

Then restart Bitbucket.

### Step 5: Add Windows Firewall Rule

```powershell
# Allow inbound connections to port 7990
New-NetFirewallRule -DisplayName "Bitbucket Server" -Direction Inbound -LocalPort 7990 -Protocol TCP -Action Allow
```

## Quick Test Matrix

| Kubernetes Location | Bitbucket URL to Use |
|---------------------|---------------------|
| Docker Desktop | `http://host.docker.internal:7990` |
| Rancher Desktop | `http://host.rancher-internal:7990` |
| WSL2 (k3s/kind/minikube) | `http://172.27.160.1:7990` |
| Separate VM/Cloud | `http://192.168.1.13:7990` |
| Minikube (Windows) | `http://192.168.1.13:7990` |

## Still Not Working?

### Option A: Use SSH Port Forwarding

```bash
# From WSL or inside Kubernetes
ssh -L 7990:localhost:7990 your-windows-user@172.27.160.1
```

### Option B: Run Bitbucket in Docker

```bash
docker run -d -p 7990:7990 -p 7999:7999 \
  --name bitbucket \
  atlassian/bitbucket-server
```

### Option C: Use ngrok for testing

```powershell
# Install ngrok
choco install ngrok

# Expose Bitbucket
ngrok http 7990

# Use the ngrok URL in ArgoCD
# Example: http://abc123.ngrok.io
```

## Most Likely Solution for Your Setup

Based on your network config, try these in order:

1. **If using Docker Desktop Kubernetes:**
   ```bash
   argocd repo add http://host.docker.internal:7990/scm/test/customer-configs.git
   ```

2. **If using WSL2 Kubernetes:**
   ```bash
   argocd repo add http://172.27.160.1:7990/scm/test/customer-configs.git
   ```

3. **Check Bitbucket is listening on all interfaces:**
   ```powershell
   netstat -an | findstr 7990
   # Should show 0.0.0.0:7990, not 127.0.0.1:7990
   ```

4. **Add firewall rule:**
   ```powershell
   New-NetFirewallRule -DisplayName "Bitbucket" -Direction Inbound -LocalPort 7990 -Protocol TCP -Action Allow
   ```
