Write-Host "========================================" -ForegroundColor Green
Write-Host "CREATING ALL SUBMISSIONS INDEXES - FIXED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$PROJECT_ID = "gameplan-787a2"

Write-Host "Creating Index 1: submissions - status ASC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config="field-path=status,order=ascending" --project=$PROJECT_ID

Write-Host ""
Write-Host "Creating Index 2: submissions - status ASC, createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config="field-path=status,order=ascending" --field-config="field-path=createdAt,order=descending" --project=$PROJECT_ID

Write-Host ""
Write-Host "Creating Index 3: submissions - createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config="field-path=createdAt,order=descending" --project=$PROJECT_ID

Write-Host ""
Write-Host "Creating Index 4: submissions - athleteUid ASC, createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config="field-path=athleteUid,order=ascending" --field-config="field-path=createdAt,order=descending" --project=$PROJECT_ID

Write-Host ""
Write-Host "Creating Index 5: submissions - coachId ASC, createdAt DESC" -ForegroundColor Yellow
gcloud firestore indexes composite create --collection-group=submissions --field-config="field-path=coachId,order=ascending" --field-config="field-path=createdAt,order=descending" --project=$PROJECT_ID

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "CHECKING STATUS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
gcloud firestore indexes composite list --project=$PROJECT_ID | Select-String "submissions"

Write-Host ""
Write-Host "Press any key to exit..."
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")