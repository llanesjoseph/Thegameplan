# PowerShell script to open all index creation URLs in browser
# This allows you to quickly create all missing Firestore indexes

$projectId = "gameplan-787a2"

Write-Host "`n=== Opening Index Creation URLs ===" -ForegroundColor Cyan
Write-Host "This will open 13 tabs in your browser." -ForegroundColor Yellow
Write-Host "Each tab has the index creation form pre-filled." -ForegroundColor Yellow
Write-Host "Just click 'Create' on each tab.`n" -ForegroundColor Yellow

Write-Host "Press ENTER to continue or CTRL+C to cancel..." -ForegroundColor Green
Read-Host

# Critical indexes first
$urls = @(
    # CRITICAL: Fixes lessons loading
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=content:createdAt:descending:COLLECTION",

    # Users
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=users:email:ascending,role:ascending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=users:role:ascending,createdAt:descending:COLLECTION",

    # Content
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=content:status:ascending,creatorUid:ascending,createdAt:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=content:creatorUid:ascending,createdAt:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=content:creatorUid:ascending,sport:ascending,createdAt:descending:COLLECTION",

    # Other collections
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=savedResponses:userId:ascending,creatorId:ascending,savedAt:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=coach_ingestion_links:creatorId:ascending,createdAt:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=ai_interaction_logs:userId:ascending,timestamp:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=ai_sessions:userId:ascending,createdAt:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=notifications:read:ascending,createdAt:descending:COLLECTION_GROUP",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=auditLogs:userId:ascending,severity:ascending,timestamp:descending:COLLECTION",
    "https://console.firebase.google.com/v1/r/project/$projectId/firestore/indexes?create_composite=auditLogs:action:ascending,timestamp:descending:COLLECTION"
)

$count = 1
foreach ($url in $urls) {
    Write-Host "Opening tab $count of $($urls.Count)..." -ForegroundColor Cyan
    Start-Process $url
    $count++

    # Small delay to prevent overwhelming the browser
    if ($count -le $urls.Count) {
        Start-Sleep -Milliseconds 500
    }
}

Write-Host "`n✅ All tabs opened!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Go to your browser (all tabs should be open)" -ForegroundColor Blue
Write-Host "  2. On each tab, click the 'Create' button" -ForegroundColor Blue
Write-Host "  3. Wait for indexes to build (1-5 minutes each)" -ForegroundColor Blue
Write-Host "  4. Check status: https://console.firebase.google.com/project/$projectId/firestore/indexes" -ForegroundColor Blue
Write-Host ""
