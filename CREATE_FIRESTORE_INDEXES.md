# Create Firestore Indexes - Step by Step Guide

## Method 1: Using Firebase Console (EASIEST - 2 MINUTES)

### Step 1: Go to Indexes Page
Click this link: https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes

### Step 2: Click "Add Index" Button
Look for the blue "Add Index" button in the top right

### Step 3: Create Index #1
- **Collection ID**: `users`
- Click "Add field"
- **Field path**: `coachId`
- **Query scope**: `Collection`
- **Order**: `Ascending`
- Click **"Create"**

### Step 4: Create Index #2
- **Collection ID**: `users`
- Click "Add field"
- **Field path**: `assignedCoachId`
- **Query scope**: `Collection`
- **Order**: `Ascending`
- Click **"Create"**

### Step 5: Create Index #3
- **Collection ID**: `submissions`
- Click "Add field"
- **Field path**: `coachId`
- **Query scope**: `Collection`
- **Order**: `Ascending`
- Click **"Create"**

### Step 6: Create Index #4
- **Collection ID**: `submissions`
- Click "Add field"
- **Field path**: `assignedCoachId`
- **Query scope**: `Collection`
- **Order**: `Ascending`
- Click **"Create"**

### Step 7: Wait for Building
Each index will show "Building..." status. Wait 1-2 minutes until all show "Enabled" (green checkmark)

### Step 8: Test
Go to any coach profile page and refresh. You should see correct counts!

---

## Method 2: Using Google Cloud CLI (Advanced)

### Step 1: Install Google Cloud CLI (if not installed)
Download from: https://cloud.google.com/sdk/docs/install

### Step 2: Open Terminal
```bash
cd C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY
```

### Step 3: Login to Google Cloud
```bash
gcloud auth login
```
- This will open a browser window
- Sign in with: joseph@crucibleanalytics.dev
- Grant permissions
- Return to terminal

### Step 4: Set the Project
```bash
gcloud config set project gameplan-787a2
```

### Step 5: Verify Project is Set
```bash
gcloud config get-value project
```
Should output: `gameplan-787a2`

### Step 6: Create Index #1 - users.coachId
```bash
gcloud firestore indexes composite create ^
  --collection-group=users ^
  --query-scope=COLLECTION ^
  --field-config=field-path=coachId,order=ASCENDING
```

Wait for "Created" message before proceeding to next index.

### Step 7: Create Index #2 - users.assignedCoachId
```bash
gcloud firestore indexes composite create ^
  --collection-group=users ^
  --query-scope=COLLECTION ^
  --field-config=field-path=assignedCoachId,order=ASCENDING
```

Wait for "Created" message.

### Step 8: Create Index #3 - submissions.coachId
```bash
gcloud firestore indexes composite create ^
  --collection-group=submissions ^
  --query-scope=COLLECTION ^
  --field-config=field-path=coachId,order=ASCENDING
```

Wait for "Created" message.

### Step 9: Create Index #4 - submissions.assignedCoachId
```bash
gcloud firestore indexes composite create ^
  --collection-group=submissions ^
  --query-scope=COLLECTION ^
  --field-config=field-path=assignedCoachId,order=ASCENDING
```

Wait for "Created" message.

### Step 10: Check Index Status
```bash
gcloud firestore indexes composite list
```

Look for the 4 new indexes in the output. They should show "CREATING" or "READY" state.

### Step 11: Wait for Indexes to Build
Indexes can take 1-5 minutes to build. Check status with:
```bash
gcloud firestore indexes composite list | grep -E "users|submissions"
```

Or check in Firebase Console:
https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes

### Step 12: Test
Once all indexes show "READY" state, go test any coach profile page!

---

## Troubleshooting

### If gcloud command not found:
1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Restart your terminal
3. Try again

### If authentication fails:
```bash
gcloud auth login --force
```

### If you get "Already exists" error:
That's good! It means the index is already created. Move to next index.

### Check all indexes:
```bash
gcloud firestore indexes composite list
```

---

## What These Indexes Do

These 4 indexes allow our code to query:
- All users assigned to a specific coach (via `coachId`)
- All users assigned to a specific coach (via `assignedCoachId`)
- All submissions for a specific coach (via `coachId`)
- All submissions for a specific coach (via `assignedCoachId`)

Without these indexes, the queries fail and coach profiles show 0 lessons/athletes.

---

## Expected Timeline

- **Firebase Console Method**: 2-3 minutes total
- **Google Cloud CLI Method**: 5-7 minutes total
- **Index Building**: 1-3 minutes per index (can be parallel)

---

## Quick Verification Commands

After creating indexes, verify they're building:

```bash
# List all composite indexes
gcloud firestore indexes composite list

# List only users collection indexes
gcloud firestore indexes composite list --filter="collectionGroup:users"

# List only submissions collection indexes
gcloud firestore indexes composite list --filter="collectionGroup:submissions"
```

---

## Need Help?

If indexes are stuck in "CREATING" state for more than 10 minutes:
1. Check Firebase Console: https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
2. Look for any error messages
3. Try deleting and recreating the stuck index

---

**RECOMMENDATION: Use Firebase Console method (Method 1) - it's faster and has a visual interface!**
