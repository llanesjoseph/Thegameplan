# Deploy Firebase Storage Rules
# This script deploys the updated storage.rules to Firebase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Storage Rules Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI installation..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
Write-Host ""

# Check if user is logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to Firebase!" -ForegroundColor Red
    Write-Host "Please run: firebase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Authenticated" -ForegroundColor Green
Write-Host ""

# Show current project
Write-Host "Current Firebase project:" -ForegroundColor Yellow
firebase use
Write-Host ""

# Confirm deployment
Write-Host "This will deploy the following rules:" -ForegroundColor Yellow
Write-Host "  - User profile image uploads" -ForegroundColor White
Write-Host "  - Creator/coach asset uploads" -ForegroundColor White
Write-Host "  - Contributor application uploads" -ForegroundColor White
Write-Host "  - Enhanced file validation" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Deploy storage rules? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Deploy storage rules
Write-Host ""
Write-Host "Deploying storage rules..." -ForegroundColor Yellow
firebase deploy --only storage

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Try uploading a profile image again" -ForegroundColor White
    Write-Host "2. Check the browser console (F12) for any errors" -ForegroundColor White
    Write-Host "3. Verify you're logged in with a valid account" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ Deployment Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Check if storage.rules file exists" -ForegroundColor White
    Write-Host "- Verify Firebase project is selected" -ForegroundColor White
    Write-Host "- Ensure you have deployment permissions" -ForegroundColor White
    Write-Host ""
    exit 1
}
