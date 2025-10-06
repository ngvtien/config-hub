# Migration script to move data from electron-react-app to config-hub
# Run this script to migrate your existing credentials and settings

$oldPath = "$env:APPDATA\electron-react-app"
$newPath = "$env:APPDATA\config-hub"

Write-Host "Config Hub Data Migration Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if old path exists
if (-not (Test-Path $oldPath)) {
    Write-Host "No data found at old location: $oldPath" -ForegroundColor Yellow
    Write-Host "Nothing to migrate." -ForegroundColor Yellow
    exit 0
}

# Check if new path already exists
if (Test-Path $newPath) {
    Write-Host "New location already exists: $newPath" -ForegroundColor Yellow
    $response = Read-Host "Do you want to merge/overwrite? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Migration cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "Creating new directory: $newPath" -ForegroundColor Green
    New-Item -ItemType Directory -Path $newPath -Force | Out-Null
}

# List files to migrate
Write-Host ""
Write-Host "Files to migrate:" -ForegroundColor Cyan
Get-ChildItem $oldPath -Recurse -File | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
$response = Read-Host "Proceed with migration? (y/N)"
if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

# Copy files
Write-Host ""
Write-Host "Migrating data..." -ForegroundColor Cyan
try {
    Copy-Item -Path "$oldPath\*" -Destination $newPath -Recurse -Force
    Write-Host "✓ Data migrated successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Migrated files:" -ForegroundColor Cyan
    Get-ChildItem $newPath -Recurse -File | ForEach-Object {
        Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Old data location: $oldPath (kept as backup)" -ForegroundColor Yellow
    Write-Host "New data location: $newPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: Old data has been kept as a backup." -ForegroundColor Cyan
    Write-Host "You can manually delete it later if everything works correctly." -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Migration complete! Please restart the application." -ForegroundColor Green
