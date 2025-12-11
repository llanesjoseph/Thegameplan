# Comprehensive Prevention Plan - Never Have Data Loading Issues Again

**Status:** Active Implementation Plan  
**Priority:** CRITICAL  
**Timeline:** 4 weeks  
**Effort:** ~60 hours total

---

## What This Plan Prevents

1. ❌ Lessons not loading due to wrong collection names
2. ❌ Missing Firestore indexes causing query failures
3. ❌ Security rules blocking legitimate queries
4. ❌ Permission errors from user role issues
5. ❌ No visibility into production errors

## What You'll Have After 4 Weeks

1. ✅ Type-safe database queries catching errors at compile time
2. ✅ Automated validation preventing bad deployments
3. ✅ Staging environment for safe testing
4. ✅ Real-time error monitoring and alerts
5. ✅ Complete documentation preventing confusion

---

## WEEK 1: IMMEDIATE FIXES

### Day 1: Fix Collection Name Bug (30 minutes)

**Problem:** API routes querying wrong collection name

**Files to Fix:**
- `app/api/coach/analytics/route.ts` - Change 'lessons' to 'content'
- Search entire codebase for any other instances

**Commands:**
```bash
# Find all wrong collection references
grep -r "collection\('lessons'\)" app/

# Should return ZERO results after fix
```

### Day 2: Add Missing Firestore Indexes (3 hours)

**Add these to `firestore.indexes.json`:**
```json
{
  "collectionGroup": "invitations",
  "fields": [
    { "fieldPath": "coachEmail", "order": "ASCENDING" },
    { "fieldPath": "used", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "invitations",
  "fields": [
    { "fieldPath": "athleteEmail", "order": "ASCENDING" },
    { "fieldPath": "used", "order": "ASCENDING" }
  ]
}
```

**Deploy:**
```bash
firebase deploy --only firestore:indexes
```

### Day 3: Add Error Boundaries (4 hours)

Create `components/ErrorBoundary.tsx` and wrap all main pages.

### Days 4-5: Set Up Testing (6 hours)

Install Vitest and create Firestore security rules tests.

---

## WEEK 2: DEPLOYMENT SAFETY

### Create Type-Safe Schema (6 hours)

**File:** `lib/firestore-schema.ts`

```typescript
export const COLLECTIONS = {
  CONTENT: 'content',  // ✅ Not 'lessons'!
  USERS: 'users',
  INVITATIONS: 'invitations',
} as const

export const FIELDS = {
  CONTENT: {
    CREATOR_UID: 'creatorUid',  // ✅ Not 'coachId'!
    TITLE: 'title',
    STATUS: 'status',
  }
} as const
```

**Usage:**
```typescript
// BEFORE (typo-prone)
collection(db, 'content')
where('creatorUid', '==', uid)

// AFTER (type-safe)
collection(db, COLLECTIONS.CONTENT)
where(FIELDS.CONTENT.CREATOR_UID, '==', uid)
```

### Set Up Staging Environment (8 hours)

1. Create staging Firebase project
2. Configure Vercel staging environment
3. Create deployment scripts
4. Test end-to-end in staging

---

## WEEK 3: MONITORING & ALERTING

### Set Up Sentry (6 hours)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configure alerts for:**
- Critical errors (>10/minute)
- Permission errors
- Slow queries (>1 second)

### Create Emergency Runbook (2 hours)

Document procedures for:
- Rolling back deployments (<5 minutes)
- Reverting Firestore rules
- Creating emergency indexes

---

## WEEK 4: DOCUMENTATION

### Database Schema Docs (4 hours)

Document:
- All collections and fields
- User role hierarchy
- Common queries with examples
- Migration history

### API Documentation (4 hours)

Document:
- All endpoints
- Request/response formats
- Error codes
- Testing instructions

### Deployment Process (2 hours)

Document:
- Pre-deployment checklist
- Staging deployment steps
- Production deployment approval
- Rollback procedures

---

## EMERGENCY PROCEDURES

### Critical Error Alert

**Rollback in <5 minutes:**
```bash
vercel ls
vercel rollback <previous-deployment-url>
```

### Permission Errors

**Revert Firestore rules:**
```bash
git checkout <previous-commit> firestore.rules
firebase deploy --only firestore:rules
```

### Missing Index

**Quick fix:**
```bash
# Add index to firestore.indexes.json
firebase deploy --only firestore:indexes
```

---

## SUCCESS METRICS

**After 4 weeks, you should have:**

- ✅ Zero collection/field name errors
- ✅ 100% queries use indexes
- ✅ <0.1% API error rate  
- ✅ <5 minute rollback time
- ✅ <2 minute error detection
- ✅ 100% deployments through staging
- ✅ Complete documentation

---

## QUICK START

### If you have 30 minutes:
Fix the collection name bug in analytics API

### If you have 4 hours:
Complete all Week 1, Days 1-3 critical fixes

### If you have 1 week:
Complete entire Week 1 (immediate fixes + testing)

---

## TOOLS NEEDED

**Already Have:**
- Next.js ✅
- Firebase ✅
- Vercel ✅
- TypeScript ✅

**Need to Add:**
- Sentry (error monitoring) - $26/month
- Firebase staging project - $50/month
- **Total cost:** ~$76/month

---

## NEXT STEPS

1. Read this entire plan (30 minutes)
2. Schedule team meeting to discuss (1 hour)
3. Start Week 1, Day 1 - fix the bug
4. Follow the plan week by week
5. Review progress weekly

**Questions?** See the full detailed plan in this document or ask the team.

---

**Last Updated:** 2025-10-10  
**Version:** 1.0
