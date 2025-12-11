# Lesson Collection Migration Script

## Problem
Lessons were accidentally saved to `content ` (with trailing space) instead of `content` collection due to a typo in the API code.

## Solution
This script migrates all lessons from the incorrect collection to the correct one.

## Prerequisites

1. **Firebase Service Account Key**
   - You need `service-account.json` in the project root
   - If you don't have it, download from Firebase Console:
     1. Go to Firebase Console → Project Settings → Service Accounts
     2. Click "Generate New Private Key"
     3. Save as `service-account.json` in project root

2. **Node.js and Dependencies**
   - Make sure you have `firebase-admin` installed
   - Run: `npm install firebase-admin`

## How to Run

### Step 1: Backup Your Database
Before running the migration, create a backup:
1. Go to Firebase Console
2. Firestore Database → Export Data
3. Save the backup

### Step 2: Run the Migration Script

```bash
cd C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY
node scripts/migrate-lessons-fix-collection-name.js
```

### Step 3: Verify Migration

1. **Check Firebase Console:**
   - Go to Firestore Database
   - Look for the `content` collection (without space)
   - Verify all 4 lessons appear there

2. **Test in App:**
   - Go to your Coach Dashboard → Lesson Library
   - You should now see all 4 lessons:
     - TEST
     - Cross Collar Choke (x3)

### Step 4: Clean Up (Optional)

After verifying everything works:
1. Go to Firebase Console → Firestore
2. Find the `content ` collection (with trailing space)
3. Delete this collection manually

## What the Script Does

1. ✅ Reads all lessons from `content ` (wrong collection)
2. ✅ Copies them to `content` (correct collection) with same IDs
3. ✅ Preserves all lesson data (title, sections, objectives, etc.)
4. ✅ Skips lessons that already exist (prevents duplicates)
5. ✅ Verifies migration was successful
6. ⚠️  Does NOT delete old collection (you do this manually after verification)

## Expected Output

```
🚀 Starting lesson migration...

📖 Reading lessons from "content " collection (with space)...
Found 4 lesson(s) in wrong collection

  📝 TEST (ID: abc123)
  📝 Cross Collar Choke (ID: def456)
  📝 Cross Collar Choke (ID: ghi789)
  📝 Cross Collar Choke (ID: jkl012)

🔄 Starting migration process...

✅ Queued: "TEST" → content/abc123
✅ Queued: "Cross Collar Choke" → content/def456
✅ Queued: "Cross Collar Choke" → content/ghi789
✅ Queued: "Cross Collar Choke" → content/jkl012

💾 Committing batch write to Firestore...
✅ All lessons successfully copied to "content" collection!

🔍 Verifying migration...
✅ Verified: 4 lesson(s) now in "content" collection

🎉 Migration complete!
```

## Troubleshooting

### Error: "Cannot find module '../service-account.json'"
- Download your Firebase service account key
- Save it as `service-account.json` in the project root

### Error: "Insufficient permissions"
- Make sure the service account has Firestore admin permissions
- Check Firebase Console → IAM & Admin

### Lessons still not showing in app
- Clear your browser cache
- Hard refresh (Ctrl+Shift+R)
- Check that the API endpoints are using `collection('content')` without space

## Safety Features

- ✅ **Non-destructive**: Copies data, doesn't delete anything automatically
- ✅ **Duplicate prevention**: Skips lessons that already exist
- ✅ **Preserves IDs**: Uses same document IDs to maintain references
- ✅ **Batch operations**: Uses Firestore batch for atomic writes

## Questions?

If you encounter any issues, check:
1. Firebase Console Firestore Database
2. Browser console for any errors
3. Service account permissions
