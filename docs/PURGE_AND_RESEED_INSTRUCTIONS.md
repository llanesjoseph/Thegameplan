# Database Purge & Reseed Instructions

## ⚠️ WARNING: THIS DELETES ALL DATA

This script will:
- ✅ Keep **joseph@crucibleanalytics.dev** as superadmin
- ❌ **DELETE ALL OTHER DATA**
- ✅ Create clean sample data with 5-role system

---

## What Gets Deleted

**Everything except Joseph's account:**
- All users (athletes, coaches, etc.)
- All athlete progress data
- All coach content
- All sessions, notifications, invitations
- All collections in the database

**What Gets Preserved:**
- joseph@crucibleanalytics.dev account
- Joseph's superadmin role

---

## What Gets Created

### Sample Users (5-Role System)

**1 Superadmin:**
- joseph@crucibleanalytics.dev (your account)

**3 Athletes:**
- sarah.athlete@test.com (Soccer, Intermediate, Age 16)
- mike.athlete@test.com (Basketball, Beginner, Age 14)
- emma.athlete@test.com (Soccer, Advanced, Age 17)

**2 Coaches:**
- alex.coach@test.com (Soccer coach, verified)
- jordan.coach@test.com (Basketball coach, verified)

**1 Assistant:**
- taylor.assistant@test.com (Assists Coach Alex)

**1 Admin:**
- admin@test.com (Platform admin)

---

## How to Run

### Step 1: Open Browser Console

1. Go to https://playbookd.crucibleanalytics.dev
2. Sign in as **joseph@crucibleanalytics.dev**
3. Open DevTools (Press F12)
4. Go to **Console** tab

### Step 2: Copy Script

1. Open `scripts/purge-and-reseed-clean.js`
2. Copy the ENTIRE file contents
3. Paste into browser console
4. Press Enter

### Step 3: Confirm Deletion

The script will ask for confirmation **twice**:
1. First confirmation: "DELETE ALL DATA?"
2. Second confirmation: "Are you ABSOLUTELY SURE?"

Both must be confirmed to proceed.

### Step 4: Wait for Completion

The script will:
1. ✅ Verify you're logged in as Joseph
2. 💾 Save Joseph's account data
3. 🗑️ Delete all collections
4. 👑 Recreate Joseph as superadmin
5. 📦 Create sample data for all 5 roles
6. 📊 Show summary

Should take **30-60 seconds** total.

---

## After Running

### Verify in Firebase Console

1. Go to Firebase Console → Firestore
2. Check `users` collection:
   - Should see 8 users total
   - Joseph should have `role: "superadmin"`
   - Sample users should have correct roles

3. Check new collections:
   - `athletes/` - 3 athlete profiles
   - `coaches/` - 2 coach profiles
   - `assistants/` - 1 assistant profile
   - `admins/` - 1 admin profile

### Set Test Account Passwords

Test accounts are created but need passwords:

1. Go to Firebase Console → Authentication
2. Find each test account
3. Click "..." menu → Reset Password
4. Send password reset email OR set password manually

### Test Each Role

**Test as Athlete:**
1. Sign in as sarah.athlete@test.com
2. Should go to `/dashboard/progress`
3. Should see athlete dashboard with cards

**Test as Coach:**
1. Sign in as alex.coach@test.com
2. Should go to `/dashboard/creator`
3. Should see coach features

**Test as Admin:**
1. Sign in as admin@test.com
2. Should go to `/dashboard/admin`
3. Should see admin features

**Test as Superadmin (you):**
1. Already logged in as joseph@crucibleanalytics.dev
2. Should have access to everything
3. Should see role switcher in dropdown

---

## Data Structure Created

### Users Collection
```
users/
  joseph-uid/
    role: "superadmin"
  athlete1/
    role: "athlete"
  coach1/
    role: "coach"
  assistant1/
    role: "assistant"
  admin1/
    role: "admin"
```

### Athletes Collection
```
athletes/
  athlete1/
    displayName: "Sarah Johnson"
    sport: "Soccer"
    skillLevel: "intermediate"
    coachId: "coach1"
```

### Coaches Collection
```
coaches/
  coach1/
    displayName: "Coach Alex Rivera"
    sport: "Soccer"
    verified: true
    status: "approved"
```

---

## Rollback

**There is no rollback!** Once you run this script, all data is permanently deleted.

If you accidentally run it:
1. You cannot undo it
2. You would need to restore from backup (if you made one)
3. Or re-enter all data manually

**That's why it asks for confirmation twice!**

---

## Common Issues

### "Not logged in as superadmin"
**Solution:** Sign out and sign in as joseph@crucibleanalytics.dev

### "Firebase not loaded"
**Solution:** Make sure you're on https://playbookd.crucibleanalytics.dev, not Firebase Console

### Test accounts can't sign in
**Solution:** Set passwords in Firebase Console → Authentication

### Athletes seeing "Become a Creator"
**Solution:** Verify role is set to `"athlete"` not `"user"` in Firestore

---

## Next Steps After Purge

1. ✅ Verify Joseph is superadmin
2. ✅ Set passwords for test accounts
3. ✅ Test each role's dashboard
4. ✅ Verify role-based routing works
5. ✅ Update Firestore security rules (if needed)
6. ✅ Start adding real users/data

---

## Quick Reference

**Script Location:** `scripts/purge-and-reseed-clean.js`

**Run On:** https://playbookd.crucibleanalytics.dev (browser console)

**Logged In As:** joseph@crucibleanalytics.dev

**Time:** ~30-60 seconds

**Confirmations Required:** 2

**Data Loss:** Everything except Joseph

**Recovery:** None (permanent deletion)

---

**Ready to purge?** Make sure you understand this deletes everything except your account!
