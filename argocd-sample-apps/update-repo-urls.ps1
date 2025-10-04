# PowerShell script to update localhost URLs to your actual IP address in ApplicationSet files

param(
    [Parameter(Mandatory=$true)]
    [string]$IpAddress
)

Write-Host "Updating ApplicationSet files to use IP: $IpAddress" -ForegroundColor Green
Write-Host ""

# Get all ApplicationSet files
$files = Get-ChildItem -Path "." -Filter "*-set.yaml"

foreach ($file in $files) {
    Write-Host "Updating $($file.Name)..." -ForegroundColor Yellow
    
    # Read content
    $content = Get-Content $file.FullName -Raw
    
    # Replace localhost with IP
    $newContent = $content -replace 'http://localhost:7990', "http://$IpAddress:7990"
    
    # Write back
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
}

Write-Host ""
Write-Host "✅ Done! All ApplicationSet files have been updated." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Register repos with ArgoCD:"
Write-Host "   argocd repo add http://$IpAddress:7990/scm/test/platform-infrastructure.git --username <user> --password <pass>"
Write-Host "   argocd repo add http://$IpAddress:7990/scm/test/customer-configs.git --username <user> --password <pass>"
Write-Host ""
Write-Host "2. Deploy ApplicationSets:"
Write-Host "   kubectl apply -f 11-product-customer-matrix-set.yaml"
