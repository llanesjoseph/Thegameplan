# PowerShell script to fix missing newlines after 'use client' directive

Write-Host "Fixing 'use client' newlines in all TSX files..." -ForegroundColor Yellow

$filesFixed = 0

# Get all TSX files
$files = Get-ChildItem -Path "app","components" -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Fix 'use client' immediately followed by import (no newline)
    $content = $content -replace "'use client' import", "'use client'`r`nimport"
    $content = $content -replace '"use client" import', "`"use client`"`r`nimport"

    # Fix 'use client' immediately followed by export (no newline)
    $content = $content -replace "'use client' export", "'use client'`r`nexport"
    $content = $content -replace '"use client" export', "`"use client`"`r`nexport"

    # Fix 'use client' immediately followed by const/let/var (no newline)
    $content = $content -replace "'use client' (const|let|var)", "'use client'`r`n`$1"
    $content = $content -replace '"use client" (const|let|var)', "`"use client`"`r`n`$1"

    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
        $filesFixed++
    }
}

Write-Host "`nTotal files fixed: $filesFixed" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
