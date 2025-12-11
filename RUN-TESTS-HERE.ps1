# Firebase Security Tests Runner
# Run this in a NEW PowerShell window (not from Claude Code terminal)

Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "Firebase Security Tests Runner" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
Set-Location "C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY"
Write-Host "Working directory: $PWD" -ForegroundColor Green

# Add Java to PATH for this session
$env:PATH = "C:\Program Files\Java\jdk-11.0.28.6-hotspot\bin;" + $env:PATH
Write-Host "Java added to PATH for this session" -ForegroundColor Green
Write-Host ""

# Verify Java is available
Write-Host "Checking Java installation..." -ForegroundColor Yellow
try {
    & java -version 2>&1 | Write-Host -ForegroundColor White
    Write-Host ""
    Write-Host "✓ Java found!" -ForegroundColor Green
} catch {
    Write-Host "✗ Java not found. Please restart your computer to update PATH." -ForegroundColor Red
    Write-Host "  After restart, try running: npm run emulator:test" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "Starting Firebase Emulator with Security Tests - 40 tests" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Run the tests
npm run emulator:test

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

pause
