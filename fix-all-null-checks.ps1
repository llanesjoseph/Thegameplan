$files = Get-ChildItem -Path "app\" -Include *.tsx,*.ts -Recurse

$count = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Pattern 1: Find lines with just "const token = await user.getIdToken()"
    # Replace with null check before it
    $pattern1 = '(\s+)(const (?:token|idToken) = await user\.getIdToken\(\))'
    if ($content -match $pattern1) {
        # Add null check before the getIdToken call
        $content = $content -replace $pattern1, "`$1if (!user) { console.error('No user found'); return; }`n`$1`$2"
        $count++
    }

    # Pattern 2: Find "try {" followed by getIdToken without null check
    $pattern2 = '(try \{\s+)(const (?:token|idToken) = await user\.getIdToken\(\))'
    while ($content -match $pattern2) {
        $content = $content -replace $pattern2, "`$1if (!user) { console.error('No user found'); return; }`n      `$2"
        $count++
    }

    # Pattern 3: Handle cases after setLoading
    $pattern3 = '(setLoading\(true\)\s+try \{\s+)(const (?:token|idToken) = await user\.getIdToken\(\))'
    while ($content -match $pattern3) {
        $content = $content -replace $pattern3, "`$1if (!user) { console.error('No user found'); return; }`n      `$2"
        $count++
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed $($file.Name) - $count instances"
        $filesModified++
    }
}

Write-Host "`n✅ Total: $filesModified files modified, $count fixes applied"
