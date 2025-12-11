@echo off
echo Setting up Java environment...
set "PATH=C:\Program Files\Java\jdk-11.0.28.6-hotspot\bin;%PATH%"

echo.
echo Checking Java version...
java -version

echo.
echo Running Firebase security tests...
npm run emulator:test
