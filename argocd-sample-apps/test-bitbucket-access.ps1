# Quick diagnostic script to test Bitbucket accessibility

Write-Host "=== Bitbucket Connectivity Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Kubernetes context
Write-Host "1. Kubernetes Context:" -ForegroundColor Yellow
kubectl config current-context
Write-Host ""

# 2. Check if Bitbucket is running and listening
Write-Host "2. Bitbucket Port Status:" -ForegroundColor Yellow
$listening = netstat -an | Select-String "7990.*LISTENING"
if ($listening) {
    Write-Host $listening -ForegroundColor Green
    if ($listening -match "127.0.0.1:7990") {
        Write-Host "⚠️  WARNING: Bitbucket is only listening on localhost!" -ForegroundColor Red
        Write-Host "   It won't be accessible from Kubernetes." -ForegroundColor Red
        Write-Host "   Configure Bitbucket to listen on 0.0.0.0" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Bitbucket is not running or not listening on port 7990" -ForegroundColor Red
}
Write-Host ""

# 3. Test from Windows
Write-Host "3. Testing from Windows:" -ForegroundColor Yellow
$urls = @(
    "http://localhost:7990",
    "http://172.27.160.1:7990",
    "http://192.168.1.13:7990"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ $url - Accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ $url - Not accessible" -ForegroundColor Red
    }
}
Write-Host ""

# 4. Test from Kubernetes
Write-Host "4. Testing from Kubernetes pod:" -ForegroundColor Yellow
Write-Host "   Creating test pod in argocd namespace..." -ForegroundColor Gray

$testCommands = @"
echo 'Testing 172.27.160.1:7990...'
timeout 3 curl -s -o /dev/null -w '%{http_code}' http://172.27.160.1:7990 && echo ' - Success' || echo ' - Failed'
echo 'Testing 192.168.1.13:7990...'
timeout 3 curl -s -o /dev/null -w '%{http_code}' http://192.168.1.13:7990 && echo ' - Success' || echo ' - Failed'
echo 'Testing host.docker.internal:7990...'
timeout 3 curl -s -o /dev/null -w '%{http_code}' http://host.docker.internal:7990 && echo ' - Success' || echo ' - Failed'
"@

kubectl run test-bitbucket --rm -i --restart=Never --image=curlimages/curl -n argocd -- sh -c $testCommands

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan

$context = kubectl config current-context
if ($context -match "docker-desktop") {
    Write-Host "✅ You're using Docker Desktop Kubernetes" -ForegroundColor Green
    Write-Host "   Use: http://host.docker.internal:7990" -ForegroundColor Yellow
} elseif ($context -match "rancher") {
    Write-Host "✅ You're using Rancher Desktop" -ForegroundColor Green
    Write-Host "   Use: http://host.rancher-internal:7990" -ForegroundColor Yellow
} else {
    Write-Host "📝 Based on the tests above, use the IP that succeeded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "If all tests failed from Kubernetes:" -ForegroundColor Red
Write-Host "1. Configure Bitbucket to listen on 0.0.0.0 (not just 127.0.0.1)" -ForegroundColor Yellow
Write-Host "2. Add Windows Firewall rule:" -ForegroundColor Yellow
Write-Host "   New-NetFirewallRule -DisplayName 'Bitbucket' -Direction Inbound -LocalPort 7990 -Protocol TCP -Action Allow" -ForegroundColor Gray
Write-Host "3. Restart Bitbucket" -ForegroundColor Yellow
