# Firestore Index Setup Guide

This guide will help you create all missing Firestore indexes for your GAMEPLAN project.

## Prerequisites

- Firebase CLI installed and logged in
- Node.js installed
- Terminal/Command Prompt access

---

## Step 1: Open a Terminal

### Windows:
1. Press `Windows + R`
2. Type `cmd` or `powershell`
3. Press `Enter`

### Alternative:
- Right-click in your project folder
- Select "Open in Terminal" (Windows 11)
- Or "Open PowerShell window here" (Windows 10)

---

## Step 2: Navigate to Project Directory

```bash
cd C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY
```

---

## Step 3: Run the Index Management Script

```bash
node create-missing-indexes.js
```

---

## What the Script Does

The script will automatically:

1. ✅ Read your `firestore.indexes.json` file
2. ✅ Check which indexes are currently deployed
3. ✅ Compare and identify missing indexes
4. ✅ Run `firebase deploy --only firestore:indexes`
5. ✅ Provide direct URLs to manually create each missing index

---

## Expected Output

You should see output similar to this:

```
=== Firestore Index Manager ===

📦 Project: gameplan-787a2

📖 Reading firestore.indexes.json...
   Found 13 indexes defined

🔍 Checking deployed indexes...
   Found 1 indexes deployed

📊 Analyzing differences...

⚠️  Found 13 missing indexes:

1. users: [email (ASCENDING), role (ASCENDING)]
   Query Scope: COLLECTION

2. users: [role (ASCENDING), createdAt (DESCENDING)]
   Query Scope: COLLECTION

3. content: [status (ASCENDING), creatorUid (ASCENDING), createdAt (DESCENDING)]
   Query Scope: COLLECTION

... (and more)
```

---

## Step 4: Create Missing Indexes

The script provides **direct clickable URLs** for each missing index.

### Critical Index (Fixes Lessons Loading Issue):

**Index #6: content → createdAt (DESCENDING)**

Click this URL:
```
https://console.firebase.google.com/v1/r/project/gameplan-787a2/firestore/indexes?create_composite=content:createdAt:descending:COLLECTION
```

This will open the Firebase Console with the form pre-filled. Just click **"Create"**.

---

## All Missing Indexes (Copy URLs from Script Output)

The script provides direct URLs for all 13 indexes:

1. **users** - email + role
2. **users** - role + createdAt
3. **content** - status + creatorUid + createdAt
4. **content** - creatorUid + createdAt
5. **content** - creatorUid + sport + createdAt
6. **content** - createdAt only ⭐ **CRITICAL**
7. **savedResponses** - userId + creatorId + savedAt
8. **coach_ingestion_links** - creatorId + createdAt
9. **ai_interaction_logs** - userId + timestamp
10. **ai_sessions** - userId + createdAt
11. **notifications** - read + createdAt (COLLECTION_GROUP)
12. **auditLogs** - userId + severity + timestamp
13. **auditLogs** - action + timestamp

---

## Step 5: Verify Index Status

### Option A: Run the Script Again

Wait 2-3 minutes after creating indexes, then run:

```bash
node create-missing-indexes.js
```

The script will show you updated status of which indexes are now deployed.

### Option B: Check Firebase Console

Visit the Firebase Console:
```
https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
```

Look for:
- 🟢 **Enabled** - Ready to use
- 🟡 **Building** - In progress (wait a few minutes)
- 🔴 **Error** - Failed (needs manual creation)

---

## Troubleshooting

### Issue: "firebase: command not found"

Install Firebase CLI:
```bash
npm install -g firebase-tools
```

### Issue: "Not logged in"

Login to Firebase:
```bash
firebase login
```

### Issue: Indexes not deploying automatically

Use the manual creation URLs provided by the script. Click each URL and create the index in the Firebase Console.

### Issue: Index stuck in "Building" status

This is normal for large collections. It can take 5-30 minutes depending on the amount of data. Check back later.

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `node create-missing-indexes.js` | Run the index management script |
| `firebase firestore:indexes` | List all deployed indexes |
| `firebase deploy --only firestore:indexes` | Deploy indexes from firestore.indexes.json |
| `firebase projects:list` | List all Firebase projects |

---

## Summary

1. Open terminal in project directory
2. Run `node create-missing-indexes.js`
3. Copy the URL for the critical index (#6)
4. Click URL → Create index in Firebase Console
5. Wait 2-3 minutes
6. Run script again to verify

**Critical Index:** `content → createdAt (DESCENDING)` - This fixes the "lessons not loading" issue!

---

## Need Help?

If you encounter any issues:
1. Check the Firebase Console for error messages
2. Verify you're logged into the correct Firebase project
3. Ensure `firestore.indexes.json` exists in your project root
4. Run `firebase projects:list` to confirm active project

---

**Last Updated:** 2025-10-10
**Project:** GAMEPLAN (gameplan-787a2)
