@echo off
REM Script to create missing Firestore composite indexes for Last Active metric
REM Project: gameplan-787a2

echo Creating missing Firestore indexes...
echo.

echo [1/3] Creating chatConversations index (userId + updatedAt)...
gcloud firestore indexes composite create ^
  --collection-group=chatConversations ^
  --query-scope=COLLECTION ^
  --field-config=field-path=userId,order=ASCENDING ^
  --field-config=field-path=updatedAt,order=DESCENDING ^
  --project=gameplan-787a2

echo.
echo [2/3] Creating messages index (senderId + createdAt)...
gcloud firestore indexes composite create ^
  --collection-group=messages ^
  --query-scope=COLLECTION ^
  --field-config=field-path=senderId,order=ASCENDING ^
  --field-config=field-path=createdAt,order=DESCENDING ^
  --project=gameplan-787a2

echo.
echo [3/3] Creating liveSessionRequests index (athleteId + createdAt)...
gcloud firestore indexes composite create ^
  --collection-group=liveSessionRequests ^
  --query-scope=COLLECTION ^
  --field-config=field-path=athleteId,order=ASCENDING ^
  --field-config=field-path=createdAt,order=DESCENDING ^
  --project=gameplan-787a2

echo.
echo Done! Indexes are being created. Check status at:
echo https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
echo.
echo Or run: gcloud firestore indexes composite list --project=gameplan-787a2
pause
