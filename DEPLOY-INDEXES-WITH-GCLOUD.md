# Deploy Firestore Indexes with gcloud CLI

This guide will help you deploy all Firestore indexes programmatically using the Google Cloud API.

## Why This Method?

The Firebase CLI has a bug where `firebase deploy --only firestore:indexes` says "Deploy complete!" but doesn't actually create the indexes. This method uses the Firestore Admin API directly to bypass the CLI.

---

## Prerequisites

- ✅ You have gcloud CLI installed
- ✅ You're in the project directory
- ✅ You have Owner/Editor permissions on the Firebase project

---

## Step-by-Step Instructions

### Step 1: Open PowerShell/Terminal

Navigate to your project directory:

```powershell
cd C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY
```

---

### Step 2: Authenticate with gcloud

Run this command to authenticate:

```bash
gcloud auth application-default login
```

**What happens:**
- A browser window will open
- Sign in with your Google account (joseph@crucibleanalytics.dev)
- Grant permissions when prompted
- You'll see "Credentials saved to file" message
- Close the browser and return to terminal

---

### Step 3: Set the Active Project (Optional but Recommended)

```bash
gcloud config set project gameplan-787a2
```

This ensures you're working with the correct Firebase project.

---

### Step 4: Run the API Deployment Script

```bash
node deploy-indexes-via-api.js
```

**Expected output:**

```
=== Deploy Firestore Indexes via API ===

🔐 Getting access token...
✅ Got access token

📖 Reading firestore.indexes.json...
   Found 12 indexes

🚀 Creating indexes via API...

1. users: [email (ASCENDING), role (ASCENDING)] ... created!
2. users: [role (ASCENDING), createdAt (DESCENDING)] ... created!
3. content : [status (ASCENDING), creatorUid (ASCENDING), createdAt (DESCENDING)] ... created!
4. content : [creatorUid (ASCENDING), createdAt (DESCENDING)] ... already exists
5. content : [creatorUid (ASCENDING), sport (ASCENDING), createdAt (DESCENDING)] ... created!
6. savedResponses: [userId (ASCENDING), creatorId (ASCENDING), savedAt (DESCENDING)] ... created!
7. coach_ingestion_links: [creatorId (ASCENDING), createdAt (DESCENDING)] ... created!
8. ai_interaction_logs: [userId (ASCENDING), timestamp (DESCENDING)] ... created!
9. ai_sessions: [userId (ASCENDING), createdAt (DESCENDING)] ... created!
10. notifications: [read (ASCENDING), createdAt (DESCENDING)] ... created!
11. auditLogs: [userId (ASCENDING), severity (ASCENDING), timestamp (DESCENDING)] ... created!
12. auditLogs: [action (ASCENDING), timestamp (DESCENDING)] ... created!

=== Summary ===
Total indexes: 12
Created: 11
Already existed: 1
Failed: 0

⏱️  Indexes are now building. This can take 1-5 minutes.
Check status at: https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
```

---

### Step 5: Verify Indexes Are Building

**Option A: Use Firebase Console**

1. Open: https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
2. Click the **"Composite"** tab
3. You should see multiple indexes with status:
   - 🟡 **Building** - In progress (normal)
   - 🟢 **Enabled** - Ready to use

**Option B: Use the Check Script**

Wait 2-3 minutes, then run:

```bash
node create-missing-indexes.js
```

Look for:
```
Deployed: 12 (or close to it)
Missing: 0 or 1
```

---

### Step 6: Wait for Indexes to Build

- Composite indexes take **1-5 minutes** to build (longer if you have lots of data)
- You can create them all at once - they build in parallel
- No action needed - just wait

---

## Troubleshooting

### Error: "gcloud: command not found"

**Solution:** Install gcloud CLI

1. Download from: https://cloud.google.com/sdk/docs/install
2. Run the installer
3. Open a **new** terminal window
4. Run: `gcloud --version` to verify
5. Try Step 2 again

---

### Error: "Could not get access token"

**Solution:** Re-authenticate

```bash
gcloud auth application-default login
```

Make sure you sign in with the account that has access to the Firebase project.

---

### Error: "PERMISSION_DENIED"

**Solution:** Check your project access

1. Go to: https://console.firebase.google.com/project/gameplan-787a2/settings/iam
2. Verify your email (joseph@crucibleanalytics.dev) has **Owner** or **Editor** role
3. If not, ask the project owner to add you

---

### Error: "Index already exists" for all indexes

**This is actually good!** It means the indexes were created on a previous run. Check the Firebase Console to verify they're enabled.

---

### Error: API returns 404 or "not found"

**Possible causes:**
1. Wrong project ID - verify with: `firebase projects:list`
2. Firestore not enabled - go to Firebase Console and enable Firestore
3. Collection names have typos - check your actual collection names in Firestore

---

## What the Script Does

The script (`deploy-indexes-via-api.js`):

1. ✅ Gets an access token from gcloud
2. ✅ Reads `firestore.indexes.json`
3. ✅ For each index, makes an HTTPS POST request to:
   ```
   https://firestore.googleapis.com/v1/projects/gameplan-787a2/databases/(default)/collectionGroups/{collection}/indexes
   ```
4. ✅ Reports success/failure for each index
5. ✅ Shows summary

---

## Expected Timeline

| Step | Time |
|------|------|
| Authenticate with gcloud | 30 seconds |
| Run the script | 10-30 seconds |
| Wait for indexes to build | 5-15 minutes |
| **Total** | **~15-20 minutes** |

---

## Verify Success

After indexes are built, you can verify by:

### 1. Check Firebase Console

All indexes should show 🟢 **Enabled** status

### 2. Test Your App

Go to your lessons page - it should load without errors

### 3. Check Browser Console

Press `F12` → Console tab - no "Missing index" errors

---

## Quick Reference Commands

```bash
# Authenticate
gcloud auth application-default login

# Set project
gcloud config set project gameplan-787a2

# Deploy indexes
node deploy-indexes-via-api.js

# Check status
node create-missing-indexes.js

# View in console
# https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
```

---

## Important Notes

- ⚠️ **Collection Name:** Your `content` collection has a trailing space: `"content "` (this is unusual but the script handles it)
- ⚠️ **Single-field indexes:** The `content.createdAt` single-field index must be created separately via the UI (you already did this)
- ✅ **Safe to re-run:** The script won't duplicate indexes - it will report "already exists"

---

## Files in This Project

| File | Purpose |
|------|---------|
| `deploy-indexes-via-api.js` | **Use this!** - API-based deployment script |
| `create-missing-indexes.js` | Check which indexes are missing |
| `force-create-indexes.js` | Print manual creation URLs |
| `open-index-creation-urls.ps1` | Open all URLs in browser (alternative method) |
| `FIRESTORE-INDEX-SETUP.md` | Original setup guide |
| `WHY-INDEXES-NOT-CREATING.md` | Explains why CLI is broken |
| `DEPLOY-INDEXES-WITH-GCLOUD.md` | **This file** - gcloud deployment guide |

---

## Summary

1. Run: `gcloud auth application-default login`
2. Run: `node deploy-indexes-via-api.js`
3. Wait 5-15 minutes
4. Check: https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
5. Done! ✅

---

**Last Updated:** 2025-10-10
**Project:** GAMEPLAN (gameplan-787a2)
**Method:** Google Cloud Firestore Admin API v1
