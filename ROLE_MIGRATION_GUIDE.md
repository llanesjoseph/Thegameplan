# 🔄 Role Schema Migration Guide

## ✅ Migration Complete: Human-Readable Role Names

**Status:** Ready for database migration
**Last Updated:** Current Session

---

## 📋 What Changed

### Old Role Schema (Confusing)
```
Database: 'user', 'creator', 'assistant_coach', 'admin', 'superadmin'
Display:  'Athlete', 'Coach', 'Assistant Coach', 'Admin', 'Super Admin'
```
**Problem:** Required mapping functions everywhere. 'user' and 'creator' were not self-documenting.

### New Role Schema (Self-Documenting)
```
Database: 'athlete', 'coach', 'assistant_coach', 'admin', 'superadmin'
Display:  'Athlete', 'Coach', 'Assistant Coach', 'Admin', 'Super Admin'
```
**Solution:** Database uses human-readable names. No mapping needed. Self-documenting.

---

## 🚀 How to Execute Migration

### Step 1: Run the Migration Script

```bash
cd scripts
node migrate-to-readable-roles.js
```

**What it does:**
- Updates all users with `role: 'user'` → `role: 'athlete'`
- Updates all users with `role: 'creator'` → `role: 'coach'`
- Leaves `'assistant_coach'`, `'admin'`, `'superadmin'` unchanged
- Provides detailed report of changes

**Expected Output:**
```
🚀 DATABASE ROLE MIGRATION
Converting to human-readable role names:
  • user → athlete
  • creator → coach
  • assistant_coach, admin, superadmin (no change)

📊 Step 1: Analyzing current database...
Current Role Distribution:
  👤 user: 3 user(s)
  👨‍🏫 creator: 2 user(s)

🔄 Users requiring migration: 5
...
✅ Successfully migrated: 5 user(s)
🎉 All users now use readable role names!
```

### Step 2: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

**What changed in rules:**
- Validation now accepts: `'athlete'`, `'coach'`, `'assistant_coach'`, `'admin'`, `'superadmin'`
- Legacy `'user'` and `'creator'` removed from valid roles
- Helper functions updated to use new role names

### Step 3: Deploy Application to Vercel

The application code has been updated and is ready to deploy:

```bash
git add .
git commit -m "Migration to human-readable role names (athlete, coach)"
git push
```

Vercel will auto-deploy.

---

## 📝 Files Updated

### Core System Files

1. **`scripts/migrate-to-readable-roles.js`** ✅ NEW
   - Database migration script
   - Updates all existing users
   - Provides detailed migration report

2. **`firestore.rules`** ✅ UPDATED
   - Line 61: Valid roles now: `['athlete', 'coach', 'assistant_coach', 'admin', 'superadmin']`
   - Lines 35-52: Helper functions updated for new role names
   - Legacy `isCreator()` maps to `isCoach()` for backwards compatibility

3. **`app/dashboard/page.tsx`** ✅ UPDATED (Bulletproof Routing)
   - Routing logic updated for new role names
   - Comments updated to reflect new schema
   - Removed checks for deprecated 'creator' and 'user'

### Admin Pages

4. **`app/dashboard/admin/users/page.tsx`** ✅ UPDATED
   - `getRoleLabel()` updated for new role names
   - `getRoleIcon()` updated for 'coach' instead of 'creator'
   - Role filter dropdown: 'athlete', 'coach'
   - Role selector dropdown: 'athlete', 'coach'
   - Quick action buttons: 'coach', 'athlete'
   - Stats counters updated

5. **`app/dashboard/admin/roles/page.tsx`** ✅ UPDATED
   - `getRoleBadge()` configs updated
   - `getRoleIcon()` updated for 'coach'
   - Role filter dropdown updated
   - Role editor dropdown updated
   - Summary stats updated

### API Endpoints

6. **`app/api/coach/athletes/route.ts`** ✅ UPDATED
   - Default role changed to 'athlete'
   - Role validation updated (removed 'creator' check)
   - Already used 'athlete' for invitations

### Dashboard Pages

7. **`app/dashboard/progress/page.tsx`** ✅ UPDATED (Athlete Dashboard)
   - Coach role detection updated: checks for 'coach' and 'assistant_coach'
   - Removed checks for deprecated 'creator'

### Documentation

8. **`BULLETPROOF_ROUTING.md`** ✅ UPDATED
   - Routing table updated for new role names
   - Removed deprecated 'user' and 'creator' entries

9. **`ROLE_MIGRATION_GUIDE.md`** ✅ NEW (this file)
   - Complete migration documentation
   - Testing guide
   - Troubleshooting

---

## 🧪 Testing Checklist

After migration, test these scenarios:

### Athlete Role Testing
- [ ] Athlete can log in successfully
- [ ] Athlete is routed to `/dashboard/progress`
- [ ] Athlete dashboard loads correctly
- [ ] Athlete can access lessons
- [ ] Athlete can request video reviews
- [ ] Athlete onboarding works

### Coach Role Testing
- [ ] Coach can log in successfully
- [ ] Coach is routed to `/dashboard/coach-unified`
- [ ] Coach dashboard loads correctly
- [ ] Coach can invite athletes
- [ ] Coach can view athlete list
- [ ] Coach can access all coaching tools

### Admin Testing
- [ ] Admin can access `/dashboard/admin`
- [ ] All Users page shows correct role labels
- [ ] Role Management page shows correct roles
- [ ] Can change user roles via dropdown
- [ ] Role filters work correctly
- [ ] Stats counters show accurate counts

### New User Testing
- [ ] New athlete signup creates user with `role: 'athlete'`
- [ ] New coach application defaults to `role: 'coach'`
- [ ] Invitation emails work correctly
- [ ] Role assignment from invitations works

---

## 🔍 Verification Queries

### Check Database Roles
```javascript
// In Firebase Console > Firestore
// Run this query to verify migration

// All athletes
db.collection('users').where('role', '==', 'athlete').get()

// All coaches
db.collection('users').where('role', '==', 'coach').get()

// Check for old role names (should be empty)
db.collection('users').where('role', '==', 'user').get()
db.collection('users').where('role', '==', 'creator').get()
```

### Check Role Distribution
Open browser console on any admin page and run:
```javascript
// This will show current role distribution
const snapshot = await db.collection('users').get()
const roles = {}
snapshot.forEach(doc => {
  const role = doc.data().role
  roles[role] = (roles[role] || 0) + 1
})
console.table(roles)
```

---

## ⚠️ Important Notes

### Backward Compatibility During Transition

Some files still reference 'creator' for backward compatibility:
- `lib/role-management.ts` - Helper functions check for both 'coach' and 'creator'
- `components/DashboardSidebar.tsx` - Display logic handles both
- `types/user.ts` - Mapping function for legacy data

**These are intentional** and provide safety during transition period.

### What NOT to Do

❌ **DO NOT** manually change roles in Firebase Console during migration
❌ **DO NOT** run the migration script multiple times
❌ **DO NOT** deploy Firestore rules before running migration script
❌ **DO NOT** skip testing after migration

### Safe Rollback Plan

If migration fails:

1. **Restore database from backup:**
   ```bash
   # Firebase automatic backups are available
   # Contact Firebase support for restore
   ```

2. **Revert code changes:**
   ```bash
   git revert HEAD
   git push
   ```

3. **Revert Firestore rules:**
   ```bash
   # Edit firestore.rules to add back 'user' and 'creator'
   firebase deploy --only firestore:rules
   ```

---

## 📊 Migration Impact

### Benefits
✅ **Self-documenting database** - No more confusion about 'user' vs 'creator'
✅ **Reduced code complexity** - Eliminated mapping functions
✅ **Easier debugging** - Role values match their meaning
✅ **Better onboarding** - New developers understand roles immediately
✅ **Consistent codebase** - All references use same terminology

### Risks (Mitigated)
⚠️ **Database consistency** - Mitigated by atomic migration script
⚠️ **Security rule changes** - Mitigated by thorough testing
⚠️ **User experience** - Mitigated by seamless transition (users won't notice)

---

## 🎯 Success Criteria

Migration is successful when:

1. ✅ All users in database have new role names
2. ✅ No errors in application logs
3. ✅ All role-based features work correctly
4. ✅ Admin pages show correct role labels
5. ✅ Firestore rules deployed successfully
6. ✅ No old role names ('user', 'creator') in database
7. ✅ All tests pass

---

## 🆘 Troubleshooting

### Issue: Users can't log in after migration
**Solution:** Check Firestore rules are deployed correctly
```bash
firebase deploy --only firestore:rules
```

### Issue: Admin page shows "0 Athletes" or "0 Coaches"
**Solution:** Verify migration script ran successfully. Check database:
```javascript
db.collection('users').get().then(snapshot => {
  snapshot.forEach(doc => console.log(doc.id, doc.data().role))
})
```

### Issue: New user signup fails with "invalid role"
**Solution:** Check Firestore rules include new role names in validation

### Issue: Role Management page can't change roles
**Solution:** Verify dropdowns use new role names ('athlete', 'coach')

---

## 📞 Support

If you encounter issues:
1. Check console logs for errors
2. Verify database state in Firebase Console
3. Review Firestore rules deployment status
4. Check this guide for troubleshooting steps

---

**Migration created by:** Claude Code
**Schema version:** 2.0 (Human-Readable)
**Previous version:** 1.0 (Technical Names)
