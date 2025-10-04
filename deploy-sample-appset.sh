#!/bin/bash
# Deploy Sample ArgoCD ApplicationSet
# This creates multiple applications using a single ApplicationSet manifest

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ArgoCD ApplicationSet Deployment${NC}"
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

# Create ApplicationSet manifest
echo -e "${YELLOW}Step 2: Creating ApplicationSet manifest...${NC}"

cat > argocd-applicationset.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: demo-applications
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - name: nginx-ingress
            chart: ingress-nginx
            repoURL: https://kubernetes.github.io/ingress-nginx
            targetRevision: "4.8.3"
            product: infrastructure
            customer: demo
            version: "1.0.0"
          
          - name: metrics-server
            chart: metrics-server
            repoURL: https://kubernetes-sigs.github.io/metrics-server
            targetRevision: "3.11.0"
            product: monitoring
            customer: demo
            version: "1.0.0"
          
          - name: redis
            chart: redis
            repoURL: https://charts.helm.sh/stable
            targetRevision: "17.11.3"
            product: database
            customer: acme-corp
            version: "7.0.0"
          
          - name: grafana
            chart: grafana
            repoURL: https://grafana.github.io/helm-charts
            targetRevision: "7.0.8"
            product: monitoring
            customer: acme-corp
            version: "10.0.0"
          
          - name: prometheus
            chart: prometheus
            repoURL: https://prometheus-community.github.io/helm-charts
            targetRevision: "25.3.1"
            product: monitoring
            customer: demo
            version: "2.45.0"
          
          - name: cert-manager
            chart: cert-manager
            repoURL: https://charts.jetstack.io
            targetRevision: "v1.13.2"
            product: infrastructure
            customer: demo
            version: "1.13.0"
  
  template:
    metadata:
      name: '{{name}}'
      labels:
        app.kubernetes.io/name: '{{name}}'
        product: '{{product}}'
        customer: '{{customer}}'
        version: '{{version}}'
    spec:
      project: default
      source:
        repoURL: '{{repoURL}}'
        chart: '{{chart}}'
        targetRevision: '{{targetRevision}}'
        helm:
          parameters:
            - name: replicaCount
              value: "1"
            - name: resources.requests.cpu
              value: "100m"
            - name: resources.requests.memory
              value: "128Mi"
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

echo -e "${GREEN}✓ ApplicationSet manifest created${NC}"
echo ""

# Apply ApplicationSet
echo -e "${YELLOW}Step 3: Deploying ApplicationSet to ArgoCD...${NC}"
$KUBECTL_CMD apply -f argocd-applicationset.yaml
echo -e "${GREEN}✓ ApplicationSet deployed${NC}"
echo ""

# Wait a moment for applications to be created
echo -e "${YELLOW}Waiting for applications to be created...${NC}"
sleep 5

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${CYAN}ApplicationSet Details:${NC}"
echo "  Name: demo-applications"
echo "  Applications: 6"
echo "  Namespace: $ARGOCD_NAMESPACE"
echo ""

echo -e "${CYAN}Created Applications:${NC}"
echo "  1. nginx-ingress   - Ingress controller"
echo "  2. metrics-server  - Cluster metrics"
echo "  3. redis          - In-memory database"
echo "  4. grafana        - Monitoring dashboard"
echo "  5. prometheus     - Metrics collection"
echo "  6. cert-manager   - Certificate management"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo "1. Check ArgoCD UI: https://argocd.k8s.local"
echo ""
echo "2. List applications:"
echo "   argocd app list"
echo ""
echo "3. View ApplicationSet:"
echo "   $KUBECTL_CMD get applicationset -n $ARGOCD_NAMESPACE"
echo ""
echo "4. View in Config Hub:"
echo "   - Open Config Hub"
echo "   - Go to ArgoCD page"
echo "   - Filter by product/customer"
echo "   - See all 6 applications"
echo ""

echo -e "${CYAN}To remove all applications:${NC}"
echo "  $KUBECTL_CMD delete -f argocd-applicationset.yaml"
echo ""

echo -e "${YELLOW}Note: Applications will sync automatically.${NC}"
echo -e "${YELLOW}ApplicationSet will manage all applications as a group.${NC}"
echo ""
echo -e "${CYAN}⚠️  Note: ApplicationSet uses common parameters for all apps.${NC}"
echo -e "${CYAN}For app-specific parameters, use deploy-sample-apps.sh instead.${NC}"
