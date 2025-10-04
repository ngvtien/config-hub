#!/bin/bash
# Deploy Sample ArgoCD Applications
# This script creates lightweight Helm-based applications in ArgoCD

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ArgoCD Sample Applications Deployment${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Configuration
ARGOCD_NAMESPACE="${1:-argocd}"
TARGET_NAMESPACE="${2:-demo-apps}"
KUBECTL_CMD="${3:-microk8s kubectl}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  ArgoCD Namespace: $ARGOCD_NAMESPACE"
echo "  Target Namespace: $TARGET_NAMESPACE"
echo "  Kubectl Command: $KUBECTL_CMD"
echo ""

# Create target namespace
echo -e "${YELLOW}Step 1: Creating target namespace...${NC}"
$KUBECTL_CMD create namespace $TARGET_NAMESPACE --dry-run=client -o yaml | $KUBECTL_CMD apply -f -
echo -e "${GREEN}✓ Namespace created/verified${NC}"
echo ""

# Create sample applications directory
MANIFESTS_DIR="argocd-sample-apps"
mkdir -p $MANIFESTS_DIR

echo -e "${YELLOW}Step 2: Creating ArgoCD Application manifests...${NC}"

# Application 1: Nginx Ingress Controller (lightweight)
cat > $MANIFESTS_DIR/01-nginx-ingress.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nginx-ingress
  namespace: argocd
  labels:
    app.kubernetes.io/name: nginx-ingress
    product: infrastructure
    customer: demo
    version: "1.0.0"
spec:
  project: default
  source:
    repoURL: https://kubernetes.github.io/ingress-nginx
    chart: ingress-nginx
    targetRevision: 4.8.3
    helm:
      parameters:
        - name: controller.replicaCount
          value: "1"
        - name: controller.resources.requests.cpu
          value: "100m"
        - name: controller.resources.requests.memory
          value: "128Mi"
        - name: controller.service.type
          value: "ClusterIP"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Application 2: Metrics Server
cat > $MANIFESTS_DIR/02-metrics-server.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: metrics-server
  namespace: argocd
  labels:
    app.kubernetes.io/name: metrics-server
    product: monitoring
    customer: demo
    version: "1.0.0"
spec:
  project: default
  source:
    repoURL: https://kubernetes-sigs.github.io/metrics-server
    chart: metrics-server
    targetRevision: 3.11.0
    helm:
      parameters:
        - name: replicas
          value: "1"
        - name: resources.requests.cpu
          value: "50m"
        - name: resources.requests.memory
          value: "64Mi"
        - name: args[0]
          value: "--kubelet-insecure-tls"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Application 3: Redis (standalone)
cat > $MANIFESTS_DIR/03-redis.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: redis
  namespace: argocd
  labels:
    app.kubernetes.io/name: redis
    product: database
    customer: acme-corp
    version: "7.0.0"
spec:
  project: default
  source:
    repoURL: https://charts.helm.sh/stable
    chart: redis
    targetRevision: 17.11.3
    helm:
      parameters:
        - name: architecture
          value: "standalone"
        - name: auth.enabled
          value: "false"
        - name: master.resources.requests.cpu
          value: "50m"
        - name: master.resources.requests.memory
          value: "64Mi"
        - name: master.persistence.enabled
          value: "false"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Application 4: Grafana (lightweight)
cat > $MANIFESTS_DIR/04-grafana.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: grafana
  namespace: argocd
  labels:
    app.kubernetes.io/name: grafana
    product: monitoring
    customer: acme-corp
    version: "10.0.0"
spec:
  project: default
  source:
    repoURL: https://grafana.github.io/helm-charts
    chart: grafana
    targetRevision: 7.0.8
    helm:
      parameters:
        - name: replicas
          value: "1"
        - name: resources.requests.cpu
          value: "100m"
        - name: resources.requests.memory
          value: "128Mi"
        - name: persistence.enabled
          value: "false"
        - name: adminPassword
          value: "admin123"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Application 5: Prometheus (lightweight)
cat > $MANIFESTS_DIR/05-prometheus.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus
  namespace: argocd
  labels:
    app.kubernetes.io/name: prometheus
    product: monitoring
    customer: demo
    version: "2.45.0"
spec:
  project: default
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: prometheus
    targetRevision: 25.3.1
    helm:
      parameters:
        - name: server.replicaCount
          value: "1"
        - name: server.resources.requests.cpu
          value: "100m"
        - name: server.resources.requests.memory
          value: "256Mi"
        - name: server.persistentVolume.enabled
          value: "false"
        - name: alertmanager.enabled
          value: "false"
        - name: pushgateway.enabled
          value: "false"
        - name: nodeExporter.enabled
          value: "false"
        - name: kubeStateMetrics.enabled
          value: "false"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Application 6: Cert-Manager
cat > $MANIFESTS_DIR/06-cert-manager.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cert-manager
  namespace: argocd
  labels:
    app.kubernetes.io/name: cert-manager
    product: infrastructure
    customer: demo
    version: "1.13.0"
spec:
  project: default
  source:
    repoURL: https://charts.jetstack.io
    chart: cert-manager
    targetRevision: v1.13.2
    helm:
      parameters:
        - name: installCRDs
          value: "true"
        - name: replicaCount
          value: "1"
        - name: resources.requests.cpu
          value: "50m"
        - name: resources.requests.memory
          value: "64Mi"
        - name: webhook.replicaCount
          value: "1"
        - name: cainjector.replicaCount
          value: "1"
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-apps
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

echo -e "${GREEN}✓ Application manifests created${NC}"
echo ""

# Apply applications
echo -e "${YELLOW}Step 3: Deploying applications to ArgoCD...${NC}"

for manifest in $MANIFESTS_DIR/*.yaml; do
    app_name=$(basename $manifest .yaml | cut -d'-' -f2-)
    echo -e "${CYAN}Deploying: $app_name${NC}"
    $KUBECTL_CMD apply -f $manifest
    echo -e "${GREEN}✓ $app_name deployed${NC}"
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo "1. Check ArgoCD UI: https://argocd.k8s.local"
echo "2. View applications:"
echo "   argocd app list"
echo ""
echo "3. Check application status:"
echo "   argocd app get <app-name>"
echo ""
echo "4. View in Config Hub:"
echo "   - Open Config Hub"
echo "   - Go to ArgoCD page"
echo "   - See all 6 applications"
echo ""

echo -e "${CYAN}Application Details:${NC}"
echo "  1. nginx-ingress   - Ingress controller"
echo "  2. metrics-server  - Cluster metrics"
echo "  3. redis          - In-memory database"
echo "  4. grafana        - Monitoring dashboard"
echo "  5. prometheus     - Metrics collection"
echo "  6. cert-manager   - Certificate management"
echo ""

echo -e "${CYAN}To remove all applications:${NC}"
echo "  $KUBECTL_CMD delete -f $MANIFESTS_DIR/"
echo ""

echo -e "${YELLOW}Note: Applications will sync automatically.${NC}"
echo -e "${YELLOW}Check ArgoCD UI or Config Hub to monitor progress.${NC}"
