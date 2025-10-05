#!/bin/bash
# ArgoCD Service Account Setup Script (Bash/WSL Version)
# This script creates a service account for Config Hub with proper permissions

set -e

# Configuration
ACCOUNT_NAME="${1:-config-hub}"
PASSWORD="${2:-ConfigHub2025!}"
NAMESPACE="${3:-argocd}"
READ_ONLY="${4:-false}"

echo "========================================"
echo "ArgoCD Service Account Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Check if logged in to ArgoCD
echo -e "${YELLOW}Step 1: Checking ArgoCD connection...${NC}"
if argocd context &>/dev/null; then
    echo -e "${GREEN}✓ Connected to ArgoCD${NC}"
else
    echo -e "${RED}✗ Not logged in to ArgoCD${NC}"
    echo -e "${YELLOW}Please login first: argocd login argocd.k8s.local --username admin --password <password> --insecure${NC}"
    exit 1
fi

# Step 2: Create ConfigMap patch for account
echo ""
echo -e "${YELLOW}Step 2: Creating service account '$ACCOUNT_NAME'...${NC}"

cat <<EOF > /tmp/argocd-cm-patch.yaml
data:
  accounts.$ACCOUNT_NAME: apiKey
  accounts.$ACCOUNT_NAME.enabled: "true"
EOF

if microk8s kubectl patch configmap argocd-cm -n $NAMESPACE --patch-file /tmp/argocd-cm-patch.yaml; then
    echo -e "${GREEN}✓ Service account configuration added${NC}"
else
    echo -e "${RED}✗ Failed to update ConfigMap${NC}"
    rm -f /tmp/argocd-cm-patch.yaml
    exit 1
fi

rm -f /tmp/argocd-cm-patch.yaml

# Step 3: Restart ArgoCD server
echo ""
echo -e "${YELLOW}Step 3: Restarting ArgoCD server...${NC}"
microk8s kubectl rollout restart deployment argocd-server -n $NAMESPACE >/dev/null
echo "Waiting for rollout to complete..."
microk8s kubectl rollout status deployment argocd-server -n $NAMESPACE --timeout=60s >/dev/null
echo -e "${GREEN}✓ ArgoCD server restarted${NC}"

# Wait for changes to propagate
echo "Waiting for changes to propagate..."
sleep 5

# Step 4: Set password for the account
echo ""
echo -e "${YELLOW}Step 4: Setting password for account...${NC}"
if argocd account update-password --account $ACCOUNT_NAME --new-password $PASSWORD 2>/dev/null; then
    echo -e "${GREEN}✓ Password set successfully${NC}"
else
    echo -e "${YELLOW}⚠ Password setting may have failed, but continuing...${NC}"
fi

# Step 5: Set RBAC permissions
echo ""
echo -e "${YELLOW}Step 5: Setting RBAC permissions...${NC}"

if [ "$READ_ONLY" = "true" ]; then
    echo -e "${CYAN}Setting READ-ONLY permissions...${NC}"
    cat <<EOF > /tmp/argocd-rbac-patch.yaml
data:
  policy.csv: |
    p, role:$ACCOUNT_NAME-readonly, applications, get, */*, allow
    p, role:$ACCOUNT_NAME-readonly, applications, list, */*, allow
    p, role:$ACCOUNT_NAME-readonly, clusters, get, *, allow
    p, role:$ACCOUNT_NAME-readonly, repositories, get, *, allow
    g, $ACCOUNT_NAME, role:$ACCOUNT_NAME-readonly
EOF
else
    echo -e "${CYAN}Setting ADMIN permissions...${NC}"
    cat <<EOF > /tmp/argocd-rbac-patch.yaml
data:
  policy.csv: |
    g, $ACCOUNT_NAME, role:admin
EOF
fi

if microk8s kubectl patch configmap argocd-rbac-cm -n $NAMESPACE --patch-file /tmp/argocd-rbac-patch.yaml; then
    echo -e "${GREEN}✓ RBAC permissions configured${NC}"
else
    echo -e "${RED}✗ Failed to update RBAC ConfigMap${NC}"
    rm -f /tmp/argocd-rbac-patch.yaml
    exit 1
fi

rm -f /tmp/argocd-rbac-patch.yaml

# Step 6: Restart ArgoCD server again
echo ""
echo -e "${YELLOW}Step 6: Restarting ArgoCD server for RBAC changes...${NC}"
microk8s kubectl rollout restart deployment argocd-server -n $NAMESPACE >/dev/null
microk8s kubectl rollout status deployment argocd-server -n $NAMESPACE --timeout=60s >/dev/null
echo -e "${GREEN}✓ ArgoCD server restarted${NC}"

# Wait for changes to propagate
echo "Waiting for RBAC changes to propagate..."
sleep 5

# Step 7: Verify account exists
echo ""
echo -e "${YELLOW}Step 7: Verifying account...${NC}"
if argocd account list | grep -q "$ACCOUNT_NAME"; then
    echo -e "${GREEN}✓ Account '$ACCOUNT_NAME' exists${NC}"
else
    echo -e "${RED}✗ Account not found in list${NC}"
    echo -e "${YELLOW}Accounts:${NC}"
    argocd account list
fi

# Step 8: Generate token
echo ""
echo -e "${YELLOW}Step 8: Generating API token...${NC}"
if TOKEN=$(argocd account generate-token --account $ACCOUNT_NAME --id "config-hub-main-token" 2>&1); then
    echo -e "${GREEN}✓ Token generated successfully!${NC}"
    echo ""
    echo "========================================"
    echo -e "${GREEN}Setup Complete!${NC}"
    echo "========================================"
    echo ""
    echo -e "${CYAN}Account Details:${NC}"
    echo "  Name: $ACCOUNT_NAME"
    echo "  Password: $PASSWORD"
    echo "  Permissions: $([ "$READ_ONLY" = "true" ] && echo "Read-Only" || echo "Admin")"
    echo ""
    echo -e "${CYAN}Your API Token:${NC}"
    echo -e "${YELLOW}$TOKEN${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "1. Copy the token above"
    echo "2. Open Config Hub → Settings → ArgoCD"
    echo "3. Enter:"
    echo "   - Server URL: https://argocd.k8s.local"
    echo "   - Auth Token: <paste token>"
    echo "   - Namespace: argocd"
    echo "4. Click 'Test Connection' then 'Save Configuration'"
    echo ""
    
    # Save token to file
    echo "$TOKEN" > /tmp/argocd-token.txt
    echo -e "${GREEN}✓ Token also saved to /tmp/argocd-token.txt${NC}"
else
    echo -e "${RED}✗ Failed to generate token${NC}"
    echo "Error: $TOKEN"
    echo ""
    echo -e "${YELLOW}You can try manually:${NC}"
    echo -e "${CYAN}argocd account generate-token --account $ACCOUNT_NAME${NC}"
    exit 1
fi
