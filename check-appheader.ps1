$pages = @(
    "app\page.tsx",
    "app\admin\contributors\page.tsx",
    "app\admin\seed\page.tsx",
    "app\admin\seed-complete\page.tsx",
    "app\admin\seed-direct\page.tsx",
    "app\admin\provision\page.tsx",
    "app\contributors\apply\page.tsx",
    "app\contributors\[creatorId]\page.tsx",
    "app\contributors\page.tsx",
    "app\dashboard\page.tsx",
    "app\dashboard\apply-coach\page.tsx",
    "app\dashboard\assistant\page.tsx",
    "app\dashboard\coach\page.tsx",
    "app\dashboard\coaching\page.tsx",
    "app\dashboard\creator\page.tsx",
    "app\dashboard\creator\analytics\page.tsx",
    "app\dashboard\creator\assistants\page.tsx",
    "app\dashboard\creator\overview\page.tsx",
    "app\dashboard\creator\requests\page.tsx",
    "app\dashboard\creator\schedule\page.tsx",
    "app\dashboard\creator-simple\page.tsx",
    "app\dashboard\progress\page.tsx",
    "app\dashboard\requests\page.tsx",
    "app\dashboard\schedule\page.tsx",
    "app\dashboard\overview\page.tsx",
    "app\dashboard\profile\page.tsx",
    "app\dashboard\superadmin\analytics\page.tsx",
    "app\dashboard\superadmin\page.tsx",
    "app\dashboard\coach\social-media\page.tsx",
    "app\dashboard\coach\profile\page.tsx",
    "app\dashboard\coach\athletes\page.tsx",
    "app\dashboard\admin\page.tsx",
    "app\dashboard\admin\analytics\page.tsx",
    "app\dashboard\admin\users\page.tsx",
    "app\dashboard\admin\settings\page.tsx",
    "app\dashboard\admin\requests\page.tsx",
    "app\dashboard\admin\roles\page.tsx",
    "app\dashboard\admin\content\page.tsx",
    "app\dashboard\admin\coach-intake\page.tsx",
    "app\dashboard\admin\creator-applications\page.tsx",
    "app\dashboard\admin\coach-applications\page.tsx",
    "app\dashboard\assistant\requests\page.tsx",
    "app\dashboard\assistant\schedule\page.tsx",
    "app\dashboard\assistant\content\page.tsx",
    "app\dashboard\assistant\athletes\page.tsx",
    "app\dashboard\assistant\analytics\page.tsx",
    "app\onboarding\page.tsx",
    "app\settings\page.tsx",
    "app\subscribe\page.tsx",
    "app\gear\page.tsx",
    "app\terms\page.tsx",
    "app\privacy\page.tsx",
    "app\emergency-fix\page.tsx",
    "app\lessons\page.tsx",
    "app\lesson\[id]\page.tsx",
    "app\athlete-onboard\[id]\page.tsx",
    "app\coach-onboard\[id]\page.tsx"
)

$results = @()

foreach ($page in $pages) {
    $fullPath = Join-Path "C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY" $page
    if (Test-Path $fullPath) {
        $hasAppHeader = Select-String -Path $fullPath -Pattern "AppHeader" -Quiet
        $results += [PSCustomObject]@{
            Page = $page
            HasAppHeader = $hasAppHeader
        }
    }
}

# Display results
Write-Host "`nPages WITHOUT AppHeader:" -ForegroundColor Red
$results | Where-Object { -not $_.HasAppHeader } | ForEach-Object { Write-Host $_.Page }

Write-Host "`nPages WITH AppHeader:" -ForegroundColor Green
$results | Where-Object { $_.HasAppHeader } | ForEach-Object { Write-Host $_.Page }

Write-Host "`nSummary:" -ForegroundColor Yellow
$withHeader = ($results | Where-Object { $_.HasAppHeader }).Count
$withoutHeader = ($results | Where-Object { -not $_.HasAppHeader }).Count
Write-Host "Pages with AppHeader: $withHeader"
Write-Host "Pages without AppHeader: $withoutHeader"