#!/bin/bash
# Script to update localhost URLs to your actual IP address in ApplicationSet files

# Check if IP address is provided
if [ -z "$1" ]; then
    echo "Usage: ./update-repo-urls.sh <your-ip-address>"
    echo "Example: ./update-repo-urls.sh 192.168.1.100"
    echo ""
    echo "To find your IP address:"
    echo "  Windows: ipconfig"
    echo "  Linux/Mac: hostname -I"
    exit 1
fi

IP_ADDRESS=$1

echo "Updating ApplicationSet files to use IP: $IP_ADDRESS"
echo ""

# Update all ApplicationSet files
for file in *-set.yaml; do
    if [ -f "$file" ]; then
        echo "Updating $file..."
        sed -i.bak "s|http://localhost:7990|http://$IP_ADDRESS:7990|g" "$file"
        rm "$file.bak" 2>/dev/null || true
    fi
done

echo ""
echo "✅ Done! All ApplicationSet files have been updated."
echo ""
echo "Next steps:"
echo "1. Register repos with ArgoCD:"
echo "   argocd repo add http://$IP_ADDRESS:7990/scm/test/platform-infrastructure.git --username <user> --password <pass>"
echo "   argocd repo add http://$IP_ADDRESS:7990/scm/test/customer-configs.git --username <user> --password <pass>"
echo ""
echo "2. Deploy ApplicationSets:"
echo "   kubectl apply -f 11-product-customer-matrix-set.yaml"
