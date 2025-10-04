# Deploy Sample ArgoCD Applications (PowerShell)
# This script creates lightweight Helm-based applications in ArgoCD

param(
    [string]$ArgoCDNamespace = "argocd",
    [string]$TargetNamespace = "demo-apps",
    [switch]$UseWSL = $true
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ArgoCD Sample Applications Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  ArgoCD Namespace: $ArgoCDNamespace"
Write-Host "  Target Namespace: $TargetNamespace"
Write-Host "  Use WSL: $UseWSL"
Write-Host ""

# Determine kubectl command
if ($UseWSL) {
    $kubectl = "wsl microk8s kubectl"
} else {
    $kubectl = "kubectl"
}

# Create target namespace
Write-Host "Step 1: Creating target namespace..." -ForegroundColor Yellow
Invoke-Expression "$kubectl create namespace $TargetNamespace --dry-run=client -o yaml | $kubectl apply -f -"
Write-Host "✓ Namespace created/verified" -ForegroundColor Green
Write-Host ""

# Create manifests directory
$manifestsDir = "argocd-sample-apps"
New-Item -ItemType Directory -Force -Path $manifestsDir | Out-Null

Write-Host "Step 2: Creating ArgoCD Application manifests..." -ForegroundColor Yellow

# Application definitions
$applications = @(
    @{
        Name = "nginx-ingress"
        Chart = "ingress-nginx"
        RepoURL = "https://kubernetes.github.io/ingress-nginx"
        Version = "4.8.3"
        Product = "infrastructure"
        Customer = "demo"
        AppVersion = "1.0.0"
        Parameters = @(
            @{name="controller.replicaCount"; value="1"}
            @{name="controller.resources.requests.cpu"; value="100m"}
            @{name="controller.resources.requests.memory"; value="128Mi"}
            @{name="controller.service.type"; value="ClusterIP"}
        )
    },
    @{
        Name = "metrics-server"
        Chart = "metrics-server"
        RepoURL = "https://kubernetes-sigs.github.io/metrics-server"
        Version = "3.11.0"
        Product = "monitoring"
        Customer = "demo"
        AppVersion = "1.0.0"
        Parameters = @(
            @{name="replicas"; value="1"}
            @{name="resources.requests.cpu"; value="50m"}
            @{name="resources.requests.memory"; value="64Mi"}
            @{name="args[0]"; value="--kubelet-insecure-tls"}
        )
    },
    @{
        Name = "redis"
        Chart = "redis"
        RepoURL = "https://charts.helm.sh/stable"
        Version = "17.11.3"
        Product = "database"
        Customer = "acme-corp"
        AppVersion = "7.0.0"
        Parameters = @(
            @{name="architecture"; value="standalone"}
            @{name="auth.enabled"; value="false"}
            @{name="master.resources.requests.cpu"; value="50m"}
            @{name="master.resources.requests.memory"; value="64Mi"}
            @{name="master.persistence.enabled"; value="false"}
        )
    },
    @{
        Name = "grafana"
        Chart = "grafana"
        RepoURL = "https://grafana.github.io/helm-charts"
        Version = "7.0.8"
        Product = "monitoring"
        Customer = "acme-corp"
        AppVersion = "10.0.0"
        Parameters = @(
            @{name="replicas"; value="1"}
            @{name="resources.requests.cpu"; value="100m"}
            @{name="resources.requests.memory"; value="128Mi"}
            @{name="persistence.enabled"; value="false"}
            @{name="adminPassword"; value="admin123"}
        )
    },
    @{
        Name = "prometheus"
        Chart = "prometheus"
        RepoURL = "https://prometheus-community.github.io/helm-charts"
        Version = "25.3.1"
        Product = "monitoring"
        Customer = "demo"
        AppVersion = "2.45.0"
        Parameters = @(
            @{name="server.replicaCount"; value="1"}
            @{name="server.resources.requests.cpu"; value="100m"}
            @{name="server.resources.requests.memory"; value="256Mi"}
            @{name="server.persistentVolume.enabled"; value="false"}
            @{name="alertmanager.enabled"; value="false"}
            @{name="pushgateway.enabled"; value="false"}
        )
    },
    @{
        Name = "cert-manager"
        Chart = "cert-manager"
        RepoURL = "https://charts.jetstack.io"
        Version = "v1.13.2"
        Product = "infrastructure"
        Customer = "demo"
        AppVersion = "1.13.0"
        Parameters = @(
            @{name="installCRDs"; value="true"}
            @{name="replicaCount"; value="1"}
            @{name="resources.requests.cpu"; value="50m"}
            @{name="resources.requests.memory"; value="64Mi"}
        )
    }
)

# Generate manifests
foreach ($app in $applications) {
    $fileName = "$manifestsDir/$($app.Name).yaml"
    
    $parametersYaml = ($app.Parameters | ForEach-Object {
        "        - name: $($_.name)`n          value: `"$($_.value)`""
    }) -join "`n"
    
    $manifest = @"
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: $($app.Name)
  namespace: $ArgoCDNamespace
  labels:
    app.kubernetes.io/name: $($app.Name)
    product: $($app.Product)
    customer: $($app.Customer)
    version: "$($app.AppVersion)"
spec:
  project: default
  source:
    repoURL: $($app.RepoURL)
    chart: $($app.Chart)
    targetRevision: $($app.Version)
    helm:
      parameters:
$parametersYaml
  destination:
    server: https://kubernetes.default.svc
    namespace: $TargetNamespace
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
"@
    
    $manifest | Out-File -FilePath $fileName -Encoding UTF8
}

Write-Host "✓ Application manifests created" -ForegroundColor Green
Write-Host ""

# Apply applications
Write-Host "Step 3: Deploying applications to ArgoCD..." -ForegroundColor Yellow

Get-ChildItem -Path $manifestsDir -Filter *.yaml | ForEach-Object {
    $appName = $_.BaseName
    Write-Host "Deploying: $appName" -ForegroundColor Cyan
    Invoke-Expression "$kubectl apply -f $($_.FullName)"
    Write-Host "✓ $appName deployed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check ArgoCD UI: https://argocd.k8s.local"
Write-Host "2. View applications:"
Write-Host "   argocd app list"
Write-Host ""
Write-Host "3. View in Config Hub:"
Write-Host "   - Open Config Hub"
Write-Host "   - Go to ArgoCD page"
Write-Host "   - See all 6 applications"
Write-Host ""

Write-Host "Application Details:" -ForegroundColor Cyan
Write-Host "  1. nginx-ingress   - Ingress controller"
Write-Host "  2. metrics-server  - Cluster metrics"
Write-Host "  3. redis          - In-memory database"
Write-Host "  4. grafana        - Monitoring dashboard"
Write-Host "  5. prometheus     - Metrics collection"
Write-Host "  6. cert-manager   - Certificate management"
Write-Host ""

Write-Host "To remove all applications:" -ForegroundColor Cyan
if ($UseWSL) {
    Write-Host "  wsl microk8s kubectl delete -f $manifestsDir/"
} else {
    Write-Host "  kubectl delete -f $manifestsDir/"
}
Write-Host ""

Write-Host "Note: Applications will sync automatically." -ForegroundColor Yellow
Write-Host "Check ArgoCD UI or Config Hub to monitor progress." -ForegroundColor Yellow
