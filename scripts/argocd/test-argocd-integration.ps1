# Test ArgoCD Integration
# This script verifies that Config Hub can connect to ArgoCD and fetch applications

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ArgoCD Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check ArgoCD CLI
Write-Host "Test 1: Checking ArgoCD CLI..." -ForegroundColor Yellow
try {
    $apps = argocd app list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ ArgoCD CLI working" -ForegroundColor Green
        $appCount = ($apps | Select-String "argocd/" | Measure-Object).Count
        Write-Host "  Found $appCount applications" -ForegroundColor Cyan
    } else {
        Write-Host "✗ ArgoCD CLI failed" -ForegroundColor Red
        Write-Host "  Error: $apps" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ ArgoCD CLI not found" -ForegroundColor Red
    Write-Host "  Install: https://argo-cd.readthedocs.io/en/stable/cli_installation/" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Check ArgoCD Server
Write-Host "Test 2: Checking ArgoCD Server..." -ForegroundColor Yellow
try {
    $version = Invoke-RestMethod -Uri "https://argocd.k8s.local/api/version" -SkipCertificateCheck -ErrorAction Stop
    Write-Host "✓ ArgoCD server reachable" -ForegroundColor Green
    Write-Host "  Version: $($version.Version)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ ArgoCD server not reachable" -ForegroundColor Red
    Write-Host "  URL: https://argocd.k8s.local" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check Session Token
Write-Host "Test 3: Testing Session Token Generation..." -ForegroundColor Yellow
try {
    $session = Invoke-RestMethod -Uri "https://argocd.k8s.local/api/v1/session" `
        -Method Post `
        -Body (@{username="admin";password="SBuukr49gxCpZ68t"} | ConvertTo-Json) `
        -ContentType "application/json" `
        -SkipCertificateCheck `
        -ErrorAction Stop
    
    if ($session.token) {
        Write-Host "✓ Session token generated" -ForegroundColor Green
        Write-Host "  Token length: $($session.token.Length) characters" -ForegroundColor Cyan
    } else {
        Write-Host "✗ No token in response" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Session token generation failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check Applications Endpoint
Write-Host "Test 4: Testing Applications Endpoint..." -ForegroundColor Yellow
try {
    $session = Invoke-RestMethod -Uri "https://argocd.k8s.local/api/v1/session" `
        -Method Post `
        -Body (@{username="admin";password="SBuukr49gxCpZ68t"} | ConvertTo-Json) `
        -ContentType "application/json" `
        -SkipCertificateCheck
    
    $apps = Invoke-RestMethod -Uri "https://argocd.k8s.local/api/v1/applications" `
        -Headers @{Authorization="Bearer $($session.token)"} `
        -SkipCertificateCheck `
        -ErrorAction Stop
    
    Write-Host "✓ Applications endpoint working" -ForegroundColor Green
    Write-Host "  Found $($apps.items.Count) applications" -ForegroundColor Cyan
    
    if ($apps.items.Count -gt 0) {
        Write-Host ""
        Write-Host "  Applications:" -ForegroundColor Cyan
        foreach ($app in $apps.items) {
            $name = $app.metadata.name
            $sync = $app.status.sync.status
            $health = $app.status.health.status
            $product = $app.metadata.labels.'product'
            $customer = $app.metadata.labels.'customer'
            
            Write-Host "    - $name" -ForegroundColor White
            Write-Host "      Sync: $sync, Health: $health" -ForegroundColor Gray
            if ($product) { Write-Host "      Product: $product" -ForegroundColor Gray }
            if ($customer) { Write-Host "      Customer: $customer" -ForegroundColor Gray }
        }
    }
} catch {
    Write-Host "✗ Applications endpoint failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Check Config Hub Settings
Write-Host "Test 5: Checking Config Hub Settings..." -ForegroundColor Yellow
$settingsPath = "$env:APPDATA\config-hub\settings-dev.json"
if (Test-Path $settingsPath) {
    try {
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        if ($settings.argocd) {
            Write-Host "✓ ArgoCD settings found" -ForegroundColor Green
            Write-Host "  Server URL: $($settings.argocd.serverUrl)" -ForegroundColor Cyan
            Write-Host "  Username: $($settings.argocd.username)" -ForegroundColor Cyan
            Write-Host "  Has Token: $(if ($settings.argocd.token) { 'Yes' } else { 'No' })" -ForegroundColor Cyan
            Write-Host "  Has Password: $(if ($settings.argocd.password) { 'Yes' } else { 'No' })" -ForegroundColor Cyan
            Write-Host "  Credential ID: $($settings.argocd.credentialId)" -ForegroundColor Cyan
        } else {
            Write-Host "⚠ ArgoCD settings not configured" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Could not read settings" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Settings file not found" -ForegroundColor Yellow
    Write-Host "  Path: $settingsPath" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed:" -ForegroundColor Green
Write-Host "1. Open Config Hub (npm run dev)" -ForegroundColor White
Write-Host "2. Click 'ArgoCD' in sidebar" -ForegroundColor White
Write-Host "3. You should see your applications!" -ForegroundColor White
Write-Host ""
Write-Host "If tests failed:" -ForegroundColor Yellow
Write-Host "1. Go to Settings → ArgoCD" -ForegroundColor White
Write-Host "2. Enter credentials" -ForegroundColor White
Write-Host "3. Click 'Test Connection'" -ForegroundColor White
Write-Host "4. Click 'Save Configuration'" -ForegroundColor White
Write-Host ""
Write-Host "For more help, see:" -ForegroundColor Cyan
Write-Host "- ARGOCD_README.md" -ForegroundColor White
Write-Host "- ARGOCD_UI_GUIDE.md" -ForegroundColor White
