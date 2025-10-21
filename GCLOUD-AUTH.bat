@echo off
echo ========================================
echo AUTHENTICATING GCLOUD CLI
echo ========================================
echo.

REM Method 1: Browser-based authentication (RECOMMENDED - works with passkeys!)
echo Opening browser for authentication...
gcloud auth login

echo.
echo After login, set your default project:
gcloud config set project gameplan-787a2

echo.
echo ========================================
echo Alternative: Use Application Default Credentials
echo ========================================
echo.
echo If browser auth doesn't work, try:
gcloud auth application-default login

echo.
echo ========================================
echo To verify you're logged in:
echo ========================================
gcloud auth list
gcloud config list

echo.
pause