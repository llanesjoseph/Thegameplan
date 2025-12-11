Write-Host "========================================" -ForegroundColor Green
Write-Host "CREATING ALL SUBMISSIONS INDEXES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$PROJECT_ID = "gameplan-787a2"
$DATABASE = "(default)"

Write-Host "Creating Index 1: submissions - status ASC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=status,order=ascending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "Creating Index 2: submissions - status ASC, createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "Creating Index 3: submissions - createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=createdAt,order=descending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "Creating Index 4: submissions - athleteUid ASC, status ASC, createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=athleteUid,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "Creating Index 5: submissions - coachId ASC, status ASC, createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=coachId,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "Creating Index 6: submissions - teamId ASC, status ASC, submittedAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=teamId,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=submittedAt,order=descending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "Creating Index 7: submissions - claimedBy ASC, status ASC, claimedAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config=field-path=claimedBy,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=claimedAt,order=descending --project=$PROJECT_ID --database=$DATABASE

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALL INDEXES CREATED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To check status:" -ForegroundColor Cyan
Write-Host "gcloud firestore indexes composite list --project=$PROJECT_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")