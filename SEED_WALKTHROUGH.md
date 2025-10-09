# 🌱 Production Seed Walkthrough

## After Manual Database Deletion

Once you've manually deleted all collections in Firebase Console, follow these steps to seed the clean production data.

---

## Prerequisites

✅ **You've manually deleted all collections in Firebase Console**
✅ **You're logged in as joseph@crucibleanalytics.dev**
✅ **You're on: https://playbookd.crucibleanalytics.dev/dashboard**

---

## Step 1: Open Developer Console

1. Press **F12** (or Ctrl+Shift+J on Windows, Cmd+Option+J on Mac)
2. Click the **Console** tab
3. You should see a blank area with a **>** cursor

---

## Step 2: Copy the Seed Script

1. Open this file:
   ```
   scripts/seed-production-clean.js
   ```

2. Select **ALL** the code (Ctrl+A or Cmd+A)

3. Copy it (Ctrl+C or Cmd+C)

---

## Step 3: Paste and Run

1. Click in the **Console** area (where it says **>**)

2. Paste the script (Ctrl+V or Cmd+V)

3. Press **Enter**

---

## Step 4: Watch the Seed Process

You'll see output like:

```
🌱 SEEDING PRODUCTION DATABASE
================================================================
Creating clean production data...
================================================================
✅ Using existing Firebase instance

📋 STEP 1: Verifying access...
✅ Logged in as: joseph@crucibleanalytics.dev
   UID: abc123...

👑 STEP 2: Creating superadmin account...
✅ Joseph superadmin account created
   Email: joseph@crucibleanalytics.dev
   Role: superadmin
   UID: abc123...

🥋 STEP 3: Creating BJJ coach account...
✅ Joseph coach account created
   Email: llanes.joseph.m@gmail.com
   Sport: BJJ
   Belt: Blue Belt
   Experience: 3 years
   Profile Photo: ✓ Set
   Status: Approved & Active
   Can now: Create lessons, send invites, manage athletes

📊 PRODUCTION DATABASE SEEDED
================================================================
✅ Clean production database ready

Accounts created:
  👑 joseph@crucibleanalytics.dev (superadmin)
  🥋 llanes.joseph.m@gmail.com (BJJ Blue Belt coach)

Database state:
  ✓ No mock data
  ✓ No test accounts
  ✓ Ready for real users

5-Role System Active:
  - athlete
  - coach
  - assistant
  - admin
  - superadmin
================================================================

🎉 SUCCESS!

📝 Next Steps:
  1. Refresh the page
  2. Sign in as llanes.joseph.m@gmail.com to test coach features
  3. Create first lesson
  4. Send athlete invitations
  5. Real users can now sign up!

🚀 Your app is ready for production!
```

---

## Step 5: Verify in Firebase Console

1. Go to **Firebase Console** (https://console.firebase.google.com)

2. Select your project: **gameplan-787a2**

3. Click **Firestore Database** in left menu

4. Check **users** collection:
   - Should see 2 users:
     - joseph@crucibleanalytics.dev (role: superadmin)
     - llanes.joseph.m@gmail.com (role: coach)

5. Check **coaches** collection:
   - Should see 1 coach:
     - joseph-coach-account with complete BJJ profile

✅ **Database is seeded!**

---

## Step 6: Test Your Accounts

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
5. Should see coach dashboard with BJJ profile

✅ Coach account works

### Test Athlete Signup
1. Open another **Incognito/Private window**
2. Go to **https://playbookd.crucibleanalytics.dev**
3. Sign up as a **new user**
4. Should automatically get role: "athlete"
5. Should go to **/dashboard/progress**

✅ Athlete signup works

---

## What You Should See

### In Firebase Console → Firestore:

```
users/
  ├── {joseph-superadmin-uid}
  │   └── role: "superadmin"
  │       email: "joseph@crucibleanalytics.dev"
  └── joseph-coach-account
      └── role: "coach"
          email: "llanes.joseph.m@gmail.com"

coaches/
  └── joseph-coach-account
      ├── displayName: "Joseph Llanes"
      ├── sport: "BJJ"
      ├── certifications: ["BJJ Blue Belt"]
      ├── experience: "3 years of coaching experience"
      ├── verified: true
      ├── status: "approved"
      └── stats: { totalAthletes: 0, totalContent: 0, ... }

(All other collections empty - ready for real data)
```

### On Your Site:

**As Superadmin (joseph@crucibleanalytics.dev):**
- ✅ Can access all dashboards
- ✅ Has role switcher in dropdown
- ✅ Can manage all users

**As Coach (llanes.joseph.m@gmail.com):**
- ✅ Complete BJJ profile visible
- ✅ Can create lessons
- ✅ Can send athlete invites
- ✅ Can access /dashboard/creator

**As New Athlete:**
- ✅ Automatically gets role: "athlete"
- ✅ Goes to /dashboard/progress
- ✅ Can browse coaches
- ✅ Can accept invitations

---

## ❌ If Something Goes Wrong

### "Not logged in" Error
```
❌ Error: Not logged in!
```
**Fix:** Sign in as joseph@crucibleanalytics.dev and try again

### "Must be logged in as..." Error
```
❌ Error: Must be logged in as joseph@crucibleanalytics.dev
```
**Fix:** Sign out and sign in as the correct account

### "Firebase not loaded" Error
```
❌ Error: Firebase not loaded
```
**Fix:** Make sure you're on https://playbookd.crucibleanalytics.dev/dashboard (not Firebase Console)

---

## 🎉 Success!

After seeding, you'll have:

✅ **Clean database** with only 2 accounts
✅ **Complete BJJ coach profile** for testing
✅ **5-role system** fully active
✅ **No mock/test data**
✅ **Ready for real users** to sign up

---

## Quick Reference

**Script Location:** `scripts/seed-production-clean.js`

**Run On:** https://playbookd.crucibleanalytics.dev/dashboard

**Logged In As:** joseph@crucibleanalytics.dev

**Opens:** DevTools → Console tab

**Paste:** Entire script contents

**Time:** ~5-10 seconds

**Result:** Clean production database with 2 accounts

---

**Ready to seed! 🌱**
