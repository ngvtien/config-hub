#!/bin/bash
# Run this in WSL to find Bitbucket container IP

echo "=== Finding Bitbucket Container ==="
echo ""

# Find Bitbucket container
echo "1. Bitbucket Container Info:"
docker ps | grep -i bitbucket || echo "No container with 'bitbucket' in name found"
echo ""

# Get container name
CONTAINER=$(docker ps --format '{{.Names}}' | grep -i bitbucket | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ Could not find Bitbucket container"
    echo ""
    echo "All running containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
    exit 1
fi

echo "2. Container Name: $CONTAINER"
echo ""

# Get container IP
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER)
echo "3. Container IP: $CONTAINER_IP"
echo ""

# Get network name
NETWORK=$(docker inspect -f '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}' $CONTAINER)
echo "4. Docker Network: $NETWORK"
echo ""

# Test connectivity
echo "5. Testing connectivity:"
echo "   From host (WSL):"
curl -s -o /dev/null -w "   http://localhost:7990 - Status: %{http_code}\n" http://localhost:7990
curl -s -o /dev/null -w "   http://$CONTAINER_IP:7990 - Status: %{http_code}\n" http://$CONTAINER_IP:7990
echo ""

# Check if Kubernetes is on same network
echo "6. Checking Kubernetes pods network:"
kubectl get pods -n argocd -o wide 2>/dev/null | head -5
echo ""

echo "=== Recommendations ==="
echo ""
echo "Option 1: Use container IP (if on same Docker network)"
echo "  argocd repo add http://$CONTAINER_IP:7990/scm/test/platform-infrastructure.git"
echo ""
echo "Option 2: Use container name (if on same Docker network)"
echo "  argocd repo add http://$CONTAINER:7990/scm/test/platform-infrastructure.git"
echo ""
echo "Option 3: Use host.docker.internal (if Kubernetes can resolve it)"
echo "  argocd repo add http://host.docker.internal:7990/scm/test/platform-infrastructure.git"
echo ""
echo "Option 4: Connect Kubernetes to Bitbucket's Docker network"
echo "  docker network connect $NETWORK <k8s-container-name>"
echo ""

# Check what Kubernetes is running
if command -v k3s &> /dev/null; then
    echo "Detected: k3s"
    echo "For k3s, use: http://$CONTAINER_IP:7990"
elif docker ps | grep -q kindest; then
    echo "Detected: kind"
    echo "For kind, you may need to connect networks or use port forwarding"
elif docker ps | grep -q minikube; then
    echo "Detected: minikube"
    echo "For minikube, use: http://$CONTAINER_IP:7990"
fi
