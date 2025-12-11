# Set Java in PATH for this PowerShell session
$env:PATH = "C:\Program Files\Java\jdk-11.0.28.6-hotspot\bin;" + $env:PATH

# Verify Java works
Write-Host "Checking Java version..." -ForegroundColor Green
java -version

# Run the security tests
Write-Host "`nRunning Firebase security tests..." -ForegroundColor Green
npm run emulator:test
