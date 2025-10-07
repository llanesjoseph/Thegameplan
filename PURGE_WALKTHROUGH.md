# 🚀 Database Purge Walkthrough - Step by Step

## What You're About to Do

**Delete everything except:**
- joseph@crucibleanalytics.dev (superadmin)
- llanes.joseph.m@gmail.com (coach)

**Result:** Clean database with 5-role system, ready for real users

---

## Step 1: Open Your Site

1. Open Chrome or Edge browser
2. Go to: **https://playbookd.crucibleanalytics.dev**
3. Sign in as **joseph@crucibleanalytics.dev**

✅ You should see your dashboard

---

## Step 2: Open Developer Tools

### Option A: Keyboard Shortcut
- Press **F12** (Windows)
- Or press **Ctrl + Shift + J** (Windows)
- Or press **Cmd + Option + J** (Mac)

### Option B: Menu
1. Click the **3 dots** (⋮) in top-right corner
2. Click **More tools**
3. Click **Developer tools**

✅ A panel should open on the right or bottom of your screen

---

## Step 3: Go to Console Tab

1. Look for tabs at the top of Developer Tools
2. Click **Console**
3. You should see a blank area with a **>** cursor

✅ This is where you'll paste the script

---

## Step 4: Copy the Script

1. Open this file in your editor:
   ```
   scripts/purge-and-reseed-clean.js
   ```

2. Select **ALL** the code (Ctrl+A or Cmd+A)

3. Copy it (Ctrl+C or Cmd+C)

✅ Script is now in your clipboard

---

## Step 5: Paste and Run

1. Click in the **Console** area (where it says **>**)

2. Paste the script (Ctrl+V or Cmd+V)

3. Press **Enter**

✅ Script will start running

---

## Step 6: First Confirmation

You'll see a popup that says:

```
⚠️  DELETE ALL DATA? This cannot be undone!
```

**What to do:**
- Click **OK** if you're sure
- Click **Cancel** if you changed your mind

✅ Click OK to continue

---

## Step 7: Second Confirmation

You'll see another popup:

```
Are you ABSOLUTELY SURE? Click OK to proceed.
```

**What to do:**
- Click **OK** to proceed with purge
- Click **Cancel** to abort

✅ Click OK to start purge

---

## Step 8: Watch the Progress

In the console, you'll see messages like:

```
🔥 DATABASE PURGE - PRODUCTION CLEAN SLATE
================================================================
⚠️  THIS WILL DELETE ALL DATA!
================================================================

📋 STEP 1: Verifying access...
✅ Logged in as: joseph@crucibleanalytics.dev
   UID: abc123...

💾 STEP 2: Saving Joseph's accounts...
✅ Joseph superadmin account saved
✅ Joseph coach account found

🗑️  STEP 3: Purging database...
Deleting users: 50 documents...
✅ Deleted users
Deleting athletes: 30 documents...
✅ Deleted athletes
...

✅ Purged 200 documents from 15 collections

👑 STEP 4: Recreating accounts...
✅ Joseph superadmin recreated
✅ Joseph coach account created
   Email: llanes.joseph.m@gmail.com
   Can now send invites and create lessons

📊 SUMMARY
================================================================
✅ Database purged and reset

Accounts created:
  👑 joseph@crucibleanalytics.dev (superadmin)
  🎓 llanes.joseph.m@gmail.com (coach)

Database is now a CLEAN SLATE
  - No mock data
  - No test accounts
  - Ready for real users

5-Role System Active:
  - athlete
  - coach
  - assistant
  - admin
  - superadmin
================================================================

🎉 SUCCESS!

📝 Next Steps:
  1. Sign in as llanes.joseph.m@gmail.com to test coach features
  2. Create lessons and content
  3. Send athlete invitations
  4. Jasmine's coach card is hard-coded (shows even before signup)
  5. Real users can now sign up and get proper roles
```

✅ **This means it worked!**

---

## Step 9: Verify in Firebase Console

1. Go to **Firebase Console** (https://console.firebase.google.com)

2. Select your project: **GAMEPLAN**

3. Click **Firestore Database** in left menu

4. Look at the **users** collection:
   - Should see 2 users:
     - joseph@crucibleanalytics.dev (role: superadmin)
     - llanes.joseph.m@gmail.com (role: coach)

5. Check other collections:
   - Most should be empty or gone
   - Only essential data remains

✅ **Database is clean!**

---

## Step 10: Test Your Accounts

### Test Superadmin (already logged in)
1. You're already signed in as joseph@crucibleanalytics.dev
2. Go to **/dashboard/admin**
3. Should see admin panel

✅ Superadmin works

### Test Coach Account
1. Open **Incognito/Private window** (Ctrl+Shift+N)
2. Go to **https://playbookd.crucibleanalytics.dev**
3. Sign in as **llanes.joseph.m@gmail.com**
4. Go to **/dashboard/creator**
5. Should see coach dashboard

✅ Coach account works

### Test Athlete Signup
1. Open another **Incognito/Private window**
2. Go to **https://playbookd.crucibleanalytics.dev**
3. Sign up as a **new user**
4. Should go to **/dashboard/progress**
5. Should see athlete dashboard with cards

✅ Athlete signup works

---

## 🎯 What You Should See After Purge

### In Firebase Console → Firestore:

```
users/
  ├── {joseph-superadmin-uid}
  │   └── role: "superadmin"
  └── {joseph-coach-uid}
      └── role: "coach"

coaches/
  └── {joseph-coach-uid}
      └── displayName: "Joseph Llanes"

(All other collections empty or minimal)
```

### On Your Site:

**As Superadmin (joseph@crucibleanalytics.dev):**
- ✅ Can access all dashboards
- ✅ Has role switcher in dropdown
- ✅ Can create admins
- ✅ Can manage users

**As Coach (llanes.joseph.m@gmail.com):**
- ✅ Can create lessons
- ✅ Can send athlete invites
- ✅ Can access /dashboard/creator
- ✅ Can build out content

**As New Athlete:**
- ✅ Gets role: "athlete"
- ✅ Goes to /dashboard/progress
- ✅ Sees card-style dashboard
- ✅ Can browse coaches (Jasmine shows up)

---

## ❌ If Something Goes Wrong

### Script Errors
If you see red error messages:
1. Copy the error message
2. Check you're logged in as joseph@crucibleanalytics.dev
3. Try refreshing the page and running again
4. If still errors, let me know the error message

### "Not logged in" Error
```
❌ Error: Not logged in!
```
**Fix:** Sign in as joseph@crucibleanalytics.dev and try again

### "Must be logged in as..." Error
```
❌ Error: Must be logged in as joseph@crucibleanalytics.dev
```
**Fix:** You're signed in as the wrong account. Sign out and sign in as joseph@crucibleanalytics.dev

### "Firebase not loaded" Error
```
❌ Error: Firebase not loaded
```
**Fix:** Make sure you're on https://playbookd.crucibleanalytics.dev, not Firebase Console

---

## 🎉 Success!

After running this script, you'll have:

✅ **Clean database** with only 2 accounts
✅ **5-role system** active (no user, creator, or guest)
✅ **Athlete-centric schema** ready
✅ **Payment collections** defined
✅ **AI chat storage** ready
✅ **Lesson tracking** ready
✅ **Ready for real users** to sign up

---

## Next Steps After Purge

1. **Test coach features** (sign in as llanes.joseph.m@gmail.com)
2. **Create first lesson**
3. **Invite first athlete**
4. **Test athlete flow**
5. **Verify routing works**
6. **Ready to launch!** 🚀

---

## Quick Reference

**Script Location:** `scripts/purge-and-reseed-clean.js`

**Run On:** https://playbookd.crucibleanalytics.dev

**Logged In As:** joseph@crucibleanalytics.dev

**Opens:** DevTools → Console tab

**Paste:** Entire script contents

**Confirm:** 2 times

**Time:** ~30-60 seconds

**Result:** Clean database, 2 accounts, ready for production

---

**Ready? Let's purge! 🔥**
