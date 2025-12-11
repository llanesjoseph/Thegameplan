# ✅ Ready to Seed - Production Database

## Current Status

🔴 **Waiting for you to manually delete database in Firebase Console**

Once deleted, you can seed the clean production data.

---

## Quick Start

### 1️⃣ Manually Delete Database (Firebase Console)

1. Go to https://console.firebase.google.com
2. Select project: **gameplan-787a2**
3. Click **Firestore Database**
4. Delete these collections (click ⋮ → Delete collection):
   - users
   - athletes
   - coaches
   - assistants
   - admins
   - profiles
   - coach_profiles
   - creator_profiles
   - contributor_profiles
   - creatorPublic
   - creator_index
   - coaching_requests
   - coach_applications
   - content
   - lessonAnalytics
   - sessions
   - notifications
   - invitations
   - feature_flags
   - savedResponses
   - creatorAnalytics
   - disclaimer_acknowledgments

✅ **Database is now empty**

---

### 2️⃣ Seed Production Data (Browser Console)

1. Go to: **https://playbookd.crucibleanalytics.dev/dashboard**
2. Sign in as: **joseph@crucibleanalytics.dev**
3. Press **F12** → Click **Console** tab
4. Open: **scripts/seed-production-clean.js**
5. Copy ALL the code (Ctrl+A, Ctrl+C)
6. Paste in Console (Ctrl+V)
7. Press **Enter**

✅ **Production data seeded!**

---

## What Gets Created

### Account 1: Superadmin
```
Email: joseph@crucibleanalytics.dev
Role: superadmin
Access: All dashboards, admin panel, user management
```

### Account 2: BJJ Coach
```
Email: llanes.joseph.m@gmail.com
Role: coach
Sport: BJJ
Belt: Blue Belt
Experience: 3 years
Profile Photo: ✓ Set
Bio: Complete BJJ profile
Can: Create lessons, send invites, manage athletes
```

### Database State
```
✓ No mock data
✓ No test accounts
✓ 5-role system active (athlete, coach, assistant, admin, superadmin)
✓ Ready for real users
```

---

## Files You Need

| File | Purpose |
|------|---------|
| **scripts/seed-production-clean.js** | Seed script (run in browser console) |
| **SEED_WALKTHROUGH.md** | Detailed step-by-step guide |
| **READY_TO_SEED.md** | This file - quick reference |

---

## Testing After Seed

### Test 1: Superadmin (you)
- ✅ Already logged in
- Go to /dashboard/admin
- Should see admin panel

### Test 2: Coach Account
- Open incognito window
- Sign in as llanes.joseph.m@gmail.com
- Go to /dashboard/creator
- Should see BJJ coach dashboard

### Test 3: New Athlete
- Open incognito window
- Sign up as new user
- Should get role: "athlete"
- Should see /dashboard/progress

---

## Important Notes

✅ **Uses correct project ID:** gameplan-787a2
✅ **No mock data** - only real production accounts
✅ **Jasmine's coach card** - still hard-coded (already in code)
✅ **5-role system** - active and ready

---

## Next Steps

1. **Manual delete** database in Firebase Console
2. **Run seed script** in browser console
3. **Test all 3 accounts** (superadmin, coach, new athlete)
4. **Ready to launch!** 🚀

---

## Need Help?

**Detailed guide:** See `SEED_WALKTHROUGH.md`
**Script location:** `scripts/seed-production-clean.js`
**Issues?** Check Firebase Console to verify project ID is gameplan-787a2

---

**Your database is ready to be seeded! 🌱**
