# Config Hub Launcher with Timing Diagnostics
Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            Config Hub                ║" -ForegroundColor Cyan
Write-Host "║   Secure Credential Management       ║" -ForegroundColor Cyan
Write-Host "║                                      ║" -ForegroundColor Cyan
Write-Host "║         Starting application...      ║" -ForegroundColor Cyan
Write-Host "║                                      ║" -ForegroundColor Cyan
Write-Host "║    Please wait while we initialize   ║" -ForegroundColor Cyan
Write-Host "║         your secure environment      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Write-Host "$(Get-Date -Format 'HH:mm:ss.fff') - Starting Config Hub..." -ForegroundColor Green

# Check if executable exists
$exePath = "Config Hub_1.0.0.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "ERROR: $exePath not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the release/1.0.0 folder" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "If startup takes more than 5 seconds, it may be due to:" -ForegroundColor Yellow
Write-Host "- Windows Defender scanning the executable" -ForegroundColor Yellow
Write-Host "- Antivirus software real-time protection" -ForegroundColor Yellow
Write-Host "- System resources or disk I/O" -ForegroundColor Yellow
Write-Host ""

# Start the application and measure time
Write-Host "Loading security modules..." -ForegroundColor Cyan
$process = Start-Process -FilePath $exePath -PassThru -Wait

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "$(Get-Date -Format 'HH:mm:ss.fff') - Config Hub closed" -ForegroundColor Green
Write-Host "Total runtime: $($duration.TotalSeconds) seconds" -ForegroundColor Magenta

if ($duration.TotalSeconds -gt 10) {
    Write-Host ""
    Write-Host "SLOW STARTUP DETECTED!" -ForegroundColor Red
    Write-Host "Consider adding Windows Defender exclusion for this folder:" -ForegroundColor Yellow
    Write-Host "$(Get-Location)" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")