# PowerShell script to replace Vault settings function

$settingsFile = "src/components/settings-page.tsx"
$snippetFile = ".output/vault-settings-snippet.txt"

# Read the files
$content = Get-Content $settingsFile -Raw
$newFunction = Get-Content $snippetFile -Raw

# Find the start and end of the old function
$startPattern = "const renderVaultSettings = \(\) => \("
$endPattern = "^\s+\)\s*$"

# Split content into lines
$lines = $content -split "`n"

# Find start line
$startLine = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $startPattern) {
        $startLine = $i
        break
    }
}

if ($startLine -eq -1) {
    Write-Error "Could not find renderVaultSettings function"
    exit 1
}

# Find end line (matching closing parenthesis)
$braceCount = 0
$endLine = -1
$started = $false

for ($i = $startLine; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Count opening parentheses
    $openCount = ($line.ToCharArray() | Where-Object { $_ -eq '(' }).Count
    $closeCount = ($line.ToCharArray() | Where-Object { $_ -eq ')' }).Count
    
    $braceCount += $openCount - $closeCount
    
    if ($i -eq $startLine) {
        $started = $true
    }
    
    # When we're back to 0 and we've started, we found the end
    if ($started -and $braceCount -eq 0 -and $line -match '^\s+\)') {
        $endLine = $i
        break
    }
}

if ($endLine -eq -1) {
    Write-Error "Could not find end of renderVaultSettings function"
    exit 1
}

Write-Host "Found function from line $($startLine + 1) to line $($endLine + 1)"

# Create new content
$beforeFunction = $lines[0..($startLine - 1)] -join "`n"
$afterFunction = $lines[($endLine + 1)..($lines.Count - 1)] -join "`n"

$newContent = $beforeFunction + "`n" + $newFunction + "`n" + $afterFunction

# Backup original file
$backupFile = "$settingsFile.backup"
Copy-Item $settingsFile $backupFile
Write-Host "Created backup at $backupFile"

# Write new content
$newContent | Set-Content $settingsFile -NoNewline

Write-Host "Successfully replaced renderVaultSettings function"
Write-Host "Old function was $($endLine - $startLine + 1) lines"
Write-Host "New function is $(($newFunction -split "`n").Count) lines"
