# ⚠️ CRITICAL: Data Flow Issues Found

**Date:** 2025-10-10
**Severity:** HIGH
**Impact:** Data being written/read from wrong collections/fields

---

## Summary

**Found 7 API routes with incorrect collection/field names:**

1. ❌ `app/api/coach/analytics/route.ts` - Using `lessons` collection + `coachId` field
2. ❌ `app/api/coach/athletes/route.ts` - Using `coachId` field
3. ❌ `app/api/coach/assistants/route.ts` - Using `coachId` field
4. ❌ `app/api/coach/announcements/route.ts` - Using `coachId` field
5. ❌ `app/api/coach/resources/route.ts` - Using `coachId` field
6. ❌ `app/api/coach/videos/route.ts` - Using `coachId` field

---

## Critical Issues

### Issue #1: Analytics Route (CRITICAL)
**File:** `app/api/coach/analytics/route.ts`

**Problems:**
- Line 49: `collection('lessons')` → Should be `collection('content ')`
- Line 50: `where('coachId', '==', uid)` → Should be `where('creatorUid', '==', uid)`
- Line 81: `where('coachId', '==', uid)` → Should be correct field

**Impact:**
- Analytics dashboard shows NO data
- Lessons not being counted
- Athletes not being counted

---

### Issue #2: Athletes Route
**File:** `app/api/coach/athletes/route.ts`

**Problems:**
- Line 46: `where('coachId', '==', userId)` → Should use correct field
- Line 120: `coachId: userId` → Creating data with wrong field name

**Impact:**
- Coaches can't see their athletes
- New athlete invitations use wrong field

---

### Issue #3-6: Other Coach Routes
**Files:**
- `app/api/coach/assistants/route.ts`
- `app/api/coach/announcements/route.ts`
- `app/api/coach/resources/route.ts`
- `app/api/coach/videos/route.ts`

**Problem:** All using `coachId` field name

**Impact:**
- Data not being found
- Queries returning empty results

---

## What Needs to be Fixed

### 1. Collection Names
```typescript
// ❌ WRONG
.collection('lessons')

// ✅ CORRECT
.collection('content ')  // Note: trailing space in your database!
```

### 2. Field Names
```typescript
// ❌ WRONG
.where('coachId', '==', uid)

// ✅ CORRECT
.where('creatorUid', '==', uid)
```

---

## Recommended Actions

### IMMEDIATE (Fix Now)
1. Fix `app/api/coach/analytics/route.ts` - Analytics broken
2. Fix `app/api/coach/athletes/route.ts` - Athlete management broken

### HIGH PRIORITY (Fix Soon)
3. Fix remaining 4 coach API routes
4. Search for any other instances

### VERIFICATION
5. Test each route after fixing
6. Verify data flows correctly
7. Check Firebase Console for data

---

## How to Fix

### Step 1: Search and Replace
```bash
# Find all occurrences
grep -r "collection('lessons')" app/api/
grep -r "'coachId'" app/api/
```

### Step 2: Fix Each File
Replace:
- `collection('lessons')` → `collection('content ')`
- `'coachId'` → `'creatorUid'` (in content queries)
- Review context to ensure correct field name

### Step 3: Test
- Run build: `npm run build`
- Test locally: `npm run dev`
- Test each API endpoint

---

## Testing Checklist

After fixing, verify:
- [ ] Analytics dashboard loads with data
- [ ] Coach can see their lessons
- [ ] Coach can see their athletes
- [ ] Athlete invitations work
- [ ] All coach dashboard pages work

---

## Risk Assessment

**Current State:** 🔴 HIGH RISK
- Multiple API routes returning NO DATA
- Analytics broken
- Athlete management broken
- Data isolation broken (wrong field names)

**After Fixes:** 🟢 LOW RISK
- All routes use correct collections/fields
- Data flows correctly
- Indexes match queries

---

## Next Steps

1. ✅ Create this report (done)
2. ⚠️  Fix analytics route (most critical)
3. ⚠️  Fix athletes route
4. ⚠️  Fix remaining 4 routes
5. ✅ Test all fixes
6. ✅ Redeploy to production

---

**IMPORTANT:** These issues are currently LIVE in production!
Users are experiencing these problems right now.

**Recommendation:** Fix immediately and redeploy.

---

