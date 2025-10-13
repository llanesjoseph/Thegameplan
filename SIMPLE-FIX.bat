@echo off
echo ========================================
echo GAMEPLAN - SIMPLE FIX FOR ROLE ISSUES
echo ========================================
echo.
echo Step 1: Re-authenticating with Firebase...
echo.
start /wait firebase login --reauth && echo. && echo ✅ Authentication successful! && echo. && echo Step 2: Installing function dependencies... && cd functions && call npm install && cd .. && echo. && echo ✅ Dependencies installed! && echo. && echo Step 3: Deploying Firestore security rules... && firebase deploy --only firestore:rules && echo. && echo ✅ Firestore rules deployed! && echo. && echo Step 4: Deploying Cloud Functions... && firebase deploy --only functions:enforceInvitationRole,functions:dailyRoleConsistencyCheck,functions:manualRoleEnforcement && echo. && echo ✅ Cloud Functions deployed! && echo. && echo Step 5: Verifying deployment... && firebase functions:list && echo. && echo ======================================== && echo ✅ ALL DONE! YOUR SYSTEM IS NOW PROTECTED && echo ======================================== && echo. && echo Your users roles are now bulletproof! && echo.
pause
