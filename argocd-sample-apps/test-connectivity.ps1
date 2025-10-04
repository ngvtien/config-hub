# Test which IP address ArgoCD can reach Bitbucket from

Write-Host "Testing Bitbucket connectivity from ArgoCD..." -ForegroundColor Cyan
Write-Host ""

# Test from a pod in the argocd namespace
$testScript = @'
echo "Testing connectivity to Bitbucket..."
echo ""
echo "Test 1: WSL IP (172.27.160.1)"
curl -v http://172.27.160.1:7990 2>&1 | head -20
echo ""
echo "Test 2: Ethernet IP (192.168.1.13)"
curl -v http://192.168.1.13:7990 2>&1 | head -20
echo ""
echo "Test 3: host.docker.internal"
curl -v http://host.docker.internal:7990 2>&1 | head -20
'@

Write-Host "Running connectivity test from ArgoCD namespace..." -ForegroundColor Yellow
kubectl run test-connectivity --rm -i --restart=Never --image=curlimages/curl -n argocd -- sh -c $testScript

Write-Host ""
Write-Host "Check the output above to see which IP successfully connected to Bitbucket" -ForegroundColor Green
