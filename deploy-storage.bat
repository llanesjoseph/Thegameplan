@echo off
echo ========================================
echo Firebase Storage Rules Deployment
echo ========================================
echo.
echo This script will:
echo 1. Authenticate with Firebase
echo 2. Deploy storage rules for video uploads
echo.
echo Press any key to continue...
pause >nul
echo.
echo Step 1: Authenticating with Firebase...
call firebase login --reauth
echo.
if %ERRORLEVEL% NEQ 0 (
    echo Authentication failed. Please try again.
    pause
    exit /b 1
)
echo.
echo Step 2: Deploying storage rules...
call firebase deploy --only storage
echo.
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Storage rules deployed!
    echo ========================================
    echo.
    echo Video upload feature is now active:
    echo - Athletes can upload videos up to 500MB
    echo - Files saved to /video-reviews/{userId}/
    echo - Coaches can access all athlete videos
    echo.
    echo Ready to test!
    echo.
) else (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED
    echo ========================================
    echo Please check the error messages above.
    echo.
)
pause
