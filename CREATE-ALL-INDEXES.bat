@echo off
echo ========================================
echo CREATING ALL SUBMISSIONS INDEXES
echo ========================================
echo.

REM Set your project ID
set PROJECT_ID=gameplan-787a2
set DATABASE=(default)

echo Creating Index 1: submissions - status ASC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=status,order=ascending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo Creating Index 2: submissions - status ASC, createdAt DESC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo Creating Index 3: submissions - createdAt DESC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo Creating Index 4: submissions - athleteUid ASC, status ASC, createdAt DESC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=athleteUid,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo Creating Index 5: submissions - coachId ASC, status ASC, createdAt DESC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=coachId,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo Creating Index 6: submissions - teamId ASC, status ASC, submittedAt DESC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=teamId,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=submittedAt,order=descending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo Creating Index 7: submissions - claimedBy ASC, status ASC, claimedAt DESC
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=claimedBy,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=claimedAt,order=descending --project=%PROJECT_ID% --database=%DATABASE%

echo.
echo ========================================
echo ALL INDEXES CREATED!
echo ========================================
echo.
echo To check status:
echo gcloud firestore indexes composite list --project=%PROJECT_ID%
echo.
pause