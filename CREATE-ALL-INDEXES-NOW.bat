@echo off
echo ============================================
echo CREATING ALL REQUIRED FIRESTORE INDEXES NOW
echo ============================================
echo.

set PROJECT_ID=gameplan-787a2

echo [1/10] Basic submissions index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [2/10] Athlete submissions index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=athleteUid,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [3/10] Status-based submissions
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [4/10] Coach submissions index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=coachId,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [5/10] Status only index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=status,order=ascending --project=%PROJECT_ID%

echo.
echo [6/10] Athlete + Status index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=athleteUid,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [7/10] Coach + Status index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=coachId,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [8/10] Team-based submissions
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=teamId,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [9/10] ClaimedBy index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=claimedBy,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID%

echo.
echo [10/10] Submitted timestamp index
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=submittedAt,order=descending --project=%PROJECT_ID%

echo.
echo ============================================
echo ALL INDEXES QUEUED FOR CREATION
echo ============================================
echo.
echo Checking index status...
gcloud firestore indexes composite list --project=%PROJECT_ID% | findstr submissions

echo.
echo NOTE: Indexes take 3-5 minutes to build in Firebase!
echo While waiting, use the BYPASS mode which doesn't need indexes.
echo.
pause