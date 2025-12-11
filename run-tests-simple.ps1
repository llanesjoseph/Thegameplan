# Add Java to PATH
$env:PATH = "C:\Program Files\Java\jdk-11.0.28.6-hotspot\bin;" + $env:PATH

# Show Java version
Write-Host "Java version:" -ForegroundColor Green
java -version

# Run tests
Write-Host ""
Write-Host "Running Firebase security tests..." -ForegroundColor Green
npm run emulator:test
