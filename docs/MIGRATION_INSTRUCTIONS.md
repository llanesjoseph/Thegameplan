# 5-Role System Migration Instructions

## Overview

This migration simplifies the role system from 8 roles to 5 clean roles:

**Before:** guest, user, athlete, creator, coach, assistant, admin, superadmin (8 roles)
**After:** athlete, coach, assistant, admin, superadmin (5 roles)

---

## Pre-Migration Checklist

- [ ] Read `DATABASE_CLEANUP_PLAN.md` completely
- [ ] Create full database backup in Firebase Console
- [ ] Test migration on staging environment first (if available)
- [ ] Ensure you're logged in as `joseph@crucibleanalytics.dev`
- [ ] Have rollback plan ready

---

## Migration Steps

### Step 1: Create Database Backup

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Import/Export" tab
4. Click "Export Database"
5. Select a Cloud Storage bucket
6. Name the export: `backup-YYYY-MM-DD-HH-mm`
7. Wait for export to complete
8. Verify export exists in Cloud Storage

### Step 2: Run Migration Script

**Option A: Browser Console (Recommended)**

1. Open https://playbookd.crucibleanalytics.dev
2. Sign in as `joseph@crucibleanalytics.dev`
3. Open browser DevTools (F12)
4. Go to Console tab
5. Copy contents of `scripts/browser-migrate-roles.js`
6. Paste into console and press Enter
7. Follow prompts and confirm each step
8. Wait for "MIGRATION SUCCESSFUL" message

**Option B: Node.js Script**

```bash
cd scripts
node migrate-to-5-role-system.js
```

### Step 3: Verify Migration

1. Check Firebase Console → Firestore → `users` collection
2. Click on a few user documents
3. Verify `role` field is one of: `athlete`, `coach`, `assistant`, `admin`, `superadmin`
4. Verify joseph@crucibleanalytics.dev has `role: "superadmin"`

### Step 4: Test Each Role

**As Superadmin (you):**
1. Access /dashboard/admin - should work
2. Access /dashboard/creator - should work
3. Try role switcher in dropdown - should show all 5 roles

**As Athlete (create test account):**
1. Sign up as athlete
2. Access /dashboard/progress - should show athlete dashboard
3. Should NOT see creator features

**As Coach (convert existing user):**
1. Set a test user to role: `coach`
2. Access /dashboard/creator - should work
3. Should see coach features

### Step 5: Update Code (if needed)

If migration script reports errors or invalid roles, you may need to update code references:

```bash
# Search for old role references
grep -r "role.*===.*'user'" .
grep -r "role.*===.*'creator'" .
grep -r "role.*===.*'guest'" .

# Replace with new roles
# user → athlete
# creator → coach
# guest → remove or redirect
```

---

## Role Mapping Reference

| Old Role | New Role | Action |
|----------|----------|---------|
| `guest` | N/A | Delete (redirect to sign in) |
| `user` | `athlete` | Migrate |
| `creator` | `coach` | Migrate |
| `coach` | `coach` | Keep as-is |
| `athlete` | `athlete` | Keep as-is |
| `assistant` | `assistant` | Keep as-is |
| `admin` | `admin` | Keep as-is |
| `superadmin` | `superadmin` | Keep as-is |

---

## Data Structure Changes

### Before Migration
```
users/
  {userId}/
    role: "user" | "creator" | ...
```

### After Migration
```
users/
  {userId}/
    role: "athlete" | "coach" | "assistant" | "admin" | "superadmin"

athletes/
  {athleteId}/
    (athlete-specific data)
    athleteProgress/
    athleteNotifications/
    athleteSessions/

coaches/
  {coachId}/
    (coach-specific data)
    coachAthletes/
    coachContent/
```

---

## Rollback Plan

If something goes wrong:

1. **Stop immediately**
2. Go to Firebase Console → Firestore
3. Click "Import/Export"
4. Select "Import Database"
5. Choose your backup from Cloud Storage
6. Wait for import to complete
7. Verify data is restored
8. Report issue for investigation

---

## Post-Migration Tasks

- [ ] Verify joseph@crucibleanalytics.dev is superadmin
- [ ] Test athlete dashboard access
- [ ] Test coach dashboard access
- [ ] Test assistant dashboard access
- [ ] Test admin dashboard access
- [ ] Update Firestore security rules (if needed)
- [ ] Update any hardcoded role checks in code
- [ ] Test role-based permissions
- [ ] Deploy updated code
- [ ] Monitor error logs for role-related issues
- [ ] Archive/delete old collections (contributor_profiles, creator_index, etc.)

---

## Common Issues & Solutions

### Issue: "Not logged in as superadmin"
**Solution:** Sign out and sign in as joseph@crucibleanalytics.dev

### Issue: "Firebase not loaded"
**Solution:** Make sure you're on the app page, not Firebase Console

### Issue: Some users still have old roles
**Solution:** Re-run migration script or manually update in Firebase Console

### Issue: Athletes seeing "Become a Creator" page
**Solution:** Check that athlete role is set correctly in `users` collection

### Issue: Coaches can't access creator dashboard
**Solution:** Verify role is set to `"coach"` not `"creator"`

---

## Success Criteria

✅ All users have one of 5 roles
✅ joseph@crucibleanalytics.dev is the only superadmin
✅ No users with role `user`, `creator`, or `guest`
✅ Athletes can access /dashboard/progress
✅ Coaches can access /dashboard/creator
✅ All dashboards load without errors
✅ Role-based routing works correctly

---

## Support

If you encounter issues during migration:

1. **Stop the migration**
2. Take screenshots of errors
3. Note which step failed
4. Do NOT continue if unsure
5. Restore from backup if needed
6. Document the issue for debugging

---

## Files Created

- `docs/DATABASE_CLEANUP_PLAN.md` - Complete schema design
- `scripts/migrate-to-5-role-system.js` - Node.js migration script
- `scripts/browser-migrate-roles.js` - Browser console migration script
- `docs/MIGRATION_INSTRUCTIONS.md` - This file

---

**Ready to migrate?** Start with Step 1: Create Database Backup!
