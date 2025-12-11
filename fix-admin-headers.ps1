# PowerShell script to add AppHeader to admin pages

$adminPages = @(
    "app\dashboard\admin\users\page.tsx",
    "app\dashboard\admin\settings\page.tsx",
    "app\dashboard\admin\requests\page.tsx",
    "app\dashboard\admin\roles\page.tsx",
    "app\dashboard\admin\content\page.tsx",
    "app\dashboard\admin\coach-applications\page.tsx"
)

foreach ($page in $adminPages) {
    $fullPath = Join-Path "C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY" $page

    if (Test-Path $fullPath) {
        Write-Host "Processing: $page" -ForegroundColor Yellow

        $content = Get-Content $fullPath -Raw

        # Check if AppHeader already exists
        if ($content -notmatch "AppHeader") {
            Write-Host "  Adding AppHeader import..." -ForegroundColor Cyan

            # Add import statement after 'use client' or at the beginning
            if ($content -match "'use client'") {
                # Find the last import statement
                if ($content -match "(import[^;]+from[^;]+;)(?=[^;]*$)") {
                    $lastImport = $matches[0]
                    $content = $content -replace [regex]::Escape($lastImport), "$lastImport`nimport AppHeader from '@/components/ui/AppHeader'"
                }
            }

            # Find the main return statement and add AppHeader
            if ($content -match "return\s*\(\s*<(main|div)[^>]*className=[`"']min-h-screen") {
                Write-Host "  Adding AppHeader component..." -ForegroundColor Cyan

                # Replace the pattern to wrap with div and add AppHeader
                $content = $content -replace "(return\s*\(\s*)<main([^>]*)className=([`"'])min-h-screen([^`"']*)\3", '$1<div className=$3min-h-screen$4$3>`n   <AppHeader />`n   <main$2'
                $content = $content -replace "(return\s*\(\s*)<div([^>]*)className=([`"'])min-h-screen([^`"']*)\3", '$1<div$2className=$3min-h-screen$4$3>`n   <AppHeader />'

                # Fix closing tags
                $content = $content -replace "(\s*)</main>(\s*)\)(\s*)\}", '$1</main>`n$1</div>$2)$3}'
            }

            Set-Content $fullPath $content
            Write-Host "  Updated successfully!" -ForegroundColor Green
        } else {
            Write-Host "  AppHeader already present, skipping..." -ForegroundColor Gray
        }
    } else {
        Write-Host "File not found: $page" -ForegroundColor Red
    }
}

Write-Host "`nAll admin pages processed!" -ForegroundColor Green