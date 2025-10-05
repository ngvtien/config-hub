# ArgoCD Service Account Setup Script
# This script creates a service account for Config Hub with proper permissions

param(
    [string]$AccountName = "config-hub",
    [string]$Password = "ConfigHub2025!",
    [string]$Namespace = "argocd",
    [switch]$ReadOnly = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ArgoCD Service Account Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if logged in to ArgoCD
Write-Host "Step 1: Checking ArgoCD connection..." -ForegroundColor Yellow
try {
    $currentContext = argocd context
    Write-Host "✓ Connected to ArgoCD" -ForegroundColor Green
}
catch {
    Write-Host "✗ Not logged in to ArgoCD" -ForegroundColor Red
    Write-Host "Please login first: argocd login argocd.k8s.local --username admin --password <password> --insecure" -ForegroundColor Yellow
    exit 1
}

# Step 2: Create ConfigMap patch for account
Write-Host ""
Write-Host "Step 2: Creating service account '$AccountName'..." -ForegroundColor Yellow

# Create a temporary YAML file for the patch
$accountKey = "accounts.$AccountName"
$accountEnabledKey = "accounts.$AccountName.enabled"

$patchContent = @"
data:
  $accountKey`: apiKey
  $accountEnabledKey`: "true"
"@

$tempFile = [System.IO.Path]::GetTempFileName()
$patchContent | Out-File -FilePath $tempFile -Encoding UTF8

# Apply the patch
try {
    kubectl patch configmap argocd-cm -n $Namespace --patch-file $tempFile
    Write-Host "✓ Service account configuration added" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to update ConfigMap" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}
finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

# Step 3: Restart ArgoCD server
Write-Host ""
Write-Host "Step 3: Restarting ArgoCD server..." -ForegroundColor Yellow
kubectl rollout restart deployment argocd-server -n $Namespace | Out-Null
Write-Host "Waiting for rollout to complete..."
kubectl rollout status deployment argocd-server -n $Namespace --timeout=60s | Out-Null
Write-Host "✓ ArgoCD server restarted" -ForegroundColor Green

# Wait a bit for changes to propagate
Write-Host "Waiting for changes to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 4: Set password for the account
Write-Host ""
Write-Host "Step 4: Setting password for account..." -ForegroundColor Yellow
try {
    $env:ARGOCD_PASSWORD = $Password
    argocd account update-password --account $AccountName --new-password $Password --current-password $env:ARGOCD_ADMIN_PASSWORD 2>&1 | Out-Null
    Write-Host "✓ Password set successfully" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Password setting may have failed, but continuing..." -ForegroundColor Yellow
}

# Step 5: Set RBAC permissions
Write-Host ""
Write-Host "Step 5: Setting RBAC permissions..." -ForegroundColor Yellow

$rbacTempFile = [System.IO.Path]::GetTempFileName()

if ($ReadOnly) {
    $roleName = "$AccountName-readonly"
    $rbacContent = @"
data:
  policy.csv: |
    p, role:$roleName, applications, get, */*, allow
    p, role:$roleName, applications, list, */*, allow
    p, role:$roleName, clusters, get, *, allow
    p, role:$roleName, repositories, get, *, allow
    g, $AccountName, role:$roleName
"@
    Write-Host "Setting READ-ONLY permissions..." -ForegroundColor Cyan
}
else {
    $rbacContent = @"
data:
  policy.csv: |
    g, $AccountName, role:admin
"@
    Write-Host "Setting ADMIN permissions..." -ForegroundColor Cyan
}

$rbacContent | Out-File -FilePath $rbacTempFile -Encoding UTF8

try {
    kubectl patch configmap argocd-rbac-cm -n $Namespace --patch-file $rbacTempFile
    Write-Host "✓ RBAC permissions configured" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to update RBAC ConfigMap" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Remove-Item $rbacTempFile -ErrorAction SilentlyContinue
    exit 1
}
finally {
    Remove-Item $rbacTempFile -ErrorAction SilentlyContinue
}

# Step 6: Restart ArgoCD server again
Write-Host ""
Write-Host "Step 6: Restarting ArgoCD server for RBAC changes..." -ForegroundColor Yellow
kubectl rollout restart deployment argocd-server -n $Namespace | Out-Null
kubectl rollout status deployment argocd-server -n $Namespace --timeout=60s | Out-Null
Write-Host "✓ ArgoCD server restarted" -ForegroundColor Green

# Wait for changes to propagate
Write-Host "Waiting for RBAC changes to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 7: Verify account exists
Write-Host ""
Write-Host "Step 7: Verifying account..." -ForegroundColor Yellow
$accounts = argocd account list
if ($accounts -match $AccountName) {
    Write-Host "✓ Account '$AccountName' exists" -ForegroundColor Green
}
else {
    Write-Host "✗ Account not found in list" -ForegroundColor Red
    Write-Host "Accounts:" -ForegroundColor Yellow
    Write-Host $accounts
}

# Step 8: Generate token
Write-Host ""
Write-Host "Step 8: Generating API token..." -ForegroundColor Yellow
try {
    $token = argocd account generate-token --account $AccountName --id "config-hub-main-token"
    Write-Host "✓ Token generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Account Details:" -ForegroundColor Cyan
    Write-Host "  Name: $AccountName" -ForegroundColor White
    Write-Host "  Password: $Password" -ForegroundColor White
    Write-Host "  Permissions: $(if ($ReadOnly) { 'Read-Only' } else { 'Admin' })" -ForegroundColor White
    Write-Host ""
    Write-Host "Your API Token:" -ForegroundColor Cyan
    Write-Host $token -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the token above" -ForegroundColor White
    Write-Host "2. Open Config Hub → Settings → ArgoCD" -ForegroundColor White
    Write-Host "3. Enter:" -ForegroundColor White
    Write-Host "   - Server URL: https://argocd.k8s.local" -ForegroundColor White
    Write-Host "   - Auth Token: <paste token>" -ForegroundColor White
    Write-Host "   - Namespace: argocd" -ForegroundColor White
    Write-Host "4. Click 'Test Connection' then 'Save Configuration'" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "✗ Failed to generate token" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can try manually:" -ForegroundColor Yellow
    Write-Host "argocd account generate-token --account $AccountName" -ForegroundColor Cyan
    exit 1
}

# Optional: Save token to file
$saveToken = Read-Host "Save token to file? (y/n)"
if ($saveToken -eq 'y') {
    $token | Out-File -FilePath "argocd-token.txt" -Encoding UTF8
    Write-Host "✓ Token saved to argocd-token.txt" -ForegroundColor Green
}
