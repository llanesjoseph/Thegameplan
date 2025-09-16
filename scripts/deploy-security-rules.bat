@echo off
REM Game Plan Platform - Security Rules Deployment Script (Windows)
REM Deploys production-ready Firestore and Storage security rules

echo 🛡️  Game Plan Platform - Security Rules Deployment
echo ==================================================

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo    npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if user is logged in to Firebase
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Firebase. Please login first:
    echo    firebase login
    pause
    exit /b 1
)

REM Set project ID
set PROJECT_ID=gameplan-787a2
echo 📋 Using Firebase project: %PROJECT_ID%

REM Backup current rules
echo 📦 Creating backup of current rules...
if exist "firestore.rules" (
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
    copy "firestore.rules" "firestore.rules.backup.%timestamp%"
    echo ✅ Firestore rules backed up
)

if exist "storage.rules" (
    copy "storage.rules" "storage.rules.backup.%timestamp%"
    echo ✅ Storage rules backed up
)

REM Deploy Firestore security rules
echo 🔥 Deploying Firestore security rules...
if exist "firestore-production.rules" (
    copy "firestore-production.rules" "firestore.rules"
    firebase deploy --only firestore:rules --project %PROJECT_ID%
    if %errorlevel% neq 0 (
        echo ❌ Firestore rules deployment failed
        pause
        exit /b 1
    )
    echo ✅ Firestore security rules deployed successfully
) else (
    echo ❌ firestore-production.rules not found
    pause
    exit /b 1
)

REM Deploy Storage security rules
echo 📁 Deploying Storage security rules...
if exist "storage-production.rules" (
    copy "storage-production.rules" "storage.rules"
    firebase deploy --only storage --project %PROJECT_ID%
    if %errorlevel% neq 0 (
        echo ❌ Storage rules deployment failed
        pause
        exit /b 1
    )
    echo ✅ Storage security rules deployed successfully
) else (
    echo ❌ storage-production.rules not found
    pause
    exit /b 1
)

REM Deploy Firestore indexes
echo 📊 Deploying Firestore indexes...
if exist "firestore.indexes.json" (
    firebase deploy --only firestore:indexes --project %PROJECT_ID%
    if %errorlevel% neq 0 (
        echo ⚠️  Firestore indexes deployment failed
    ) else (
        echo ✅ Firestore indexes deployed successfully
    )
) else (
    echo ⚠️  firestore.indexes.json not found - skipping indexes deployment
)

REM Test deployment
echo 🧪 Testing security rules deployment...
echo    - Checking Firestore rules...
firebase firestore:rules:test --project %PROJECT_ID%
if %errorlevel% neq 0 (
    echo ⚠️  Firestore rules test failed
)

echo    - Checking Storage rules...
firebase storage:rules:test --project %PROJECT_ID%
if %errorlevel% neq 0 (
    echo ⚠️  Storage rules test failed
)

echo.
echo 🎉 Security rules deployment completed!
echo.
echo 📋 Next steps:
echo    1. Test user authentication and authorization
echo    2. Verify role-based access control works correctly
echo    3. Test file upload permissions and size limits
echo    4. Monitor security logs for any issues
echo    5. Update your application to handle new security restrictions
echo.
echo ⚠️  Important: Your old open security rules have been replaced!
echo    Make sure your application works with the new restrictive rules.
echo    Check the backup files if you need to revert.
echo.
echo 🔍 To monitor security events:
echo    firebase functions:log --project %PROJECT_ID%
echo.
pause
