@echo off
echo ================================
echo AUTOMATIC DEPLOYMENT SCRIPT
echo ================================
echo.
echo This script will:
echo 1. Wait 5 minutes for Google Cloud setup
echo 2. Deploy Cloud Functions
echo 3. Deploy Firestore Rules
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul
echo.

echo [Step 1/3] Waiting 5 minutes for Google Cloud to finish setup...
echo Started at: %TIME%
timeout /t 300 /nobreak
echo.

echo [Step 2/3] Deploying Cloud Functions...
echo.
firebase deploy --only functions --force
echo.

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Functions deployed!
    echo.
    echo [Step 3/3] Deploying Firestore Security Rules...
    echo.
    firebase deploy --only firestore:rules
    echo.

    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ================================
        echo ALL DONE! DEPLOYMENT COMPLETE!
        echo ================================
        echo.
        echo Your Cloud Functions are now live:
        echo - onLessonPublished
        echo - onAthleteAssigned
        echo - onLessonCompleted
        echo - syncAthleteData
        echo.
        echo Security rules deployed for:
        echo - coach_rosters
        echo - athlete_feed
        echo.
    ) else (
        echo.
        echo WARNING: Rules deployment failed
        echo Try running manually: firebase deploy --only firestore:rules
        echo.
    )
) else (
    echo.
    echo ERROR: Functions deployment still failing
    echo.
    echo Try waiting another 5 minutes and run:
    echo firebase deploy --only functions --force
    echo.
)

echo.
echo Press any key to exit...
pause >nul
