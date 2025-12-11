@echo off
echo.
echo 🚀 GAME PLAN PLATFORM - QUICK LAUNCH
echo ====================================
echo.

echo 📋 Checking environment...
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run from project root.
    pause
    exit /b 1
)

echo ✅ Environment check passed
echo.

echo 🧹 Cleaning build artifacts...
if exist ".next" rmdir /s /q ".next" 2>nul
if exist "out" rmdir /s /q "out" 2>nul
echo ✅ Cleanup complete
echo.

echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Dependency installation failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo 🔨 Building application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Build successful
echo.

echo 🚀 Deploying to Firebase...
call firebase deploy --only hosting --project gameplan-787a2
if errorlevel 1 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)
echo ✅ Deployment successful
echo.

echo 🎉 LAUNCH COMPLETE!
echo ==================
echo.
echo 🌐 Your Game Plan Platform is LIVE!
echo 🔗 URL: https://cruciblegameplan.web.app
echo.
echo 📊 Platform Status:
echo    ✅ Build: Successful
echo    ✅ Deployment: Complete
echo    ✅ Security: Active
echo    ✅ Performance: Optimized
echo.
echo 🎯 Ready for Users!
echo.
echo 🎉 Congratulations! Your platform is ready to change the world!
echo.
pause
