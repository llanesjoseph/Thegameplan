# Quick Start: Prevent Future Incidents

**This is your day-by-day action plan to implement the comprehensive prevention strategy.**

---

## Overview

**Total Time:** 4 weeks
**Team Size:** 2-3 developers
**Priority:** High (prevents recurring production incidents)

---

## Week 1: CRITICAL FIXES (Must Do Immediately)

### Day 1: Fix Collection Name Bug (4 hours)

**What:** Fix the analytics API that's querying wrong collection.

**Steps:**
1. Open `C:\Users\bigpe\OneDrive\Desktop\Crucible\GAMEPLAN-SOURCE-ONLY\app\api\coach\analytics\route.ts`
2. Line 49: Change `.collection('lessons')` to `.collection('content')`
3. Line 50: Change `.where('coachId', '==', uid)` to `.where('creatorUid', '==', uid)`
4. Test locally
5. Deploy to production

**Validation:**
```bash
# Search for any other instances
grep -r "collection('lessons')" app/ lib/ --include="*.ts"
```

**Success Criteria:** Analytics loads without errors.

---

### Day 2: Add Missing Indexes (3 hours)

**What:** Add Firestore composite indexes to prevent query failures.

**Steps:**
1. Open `firestore.indexes.json`
2. Add these indexes:
```json
{
  "collectionGroup": "content",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "creatorUid", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "messages",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

3. Deploy:
```bash
firebase deploy --only firestore:indexes --project production
```

4. Wait 5-15 minutes for indexes to build
5. Check Firebase Console > Firestore > Indexes (all should show "Enabled")

**Success Criteria:** All queries work, no "missing index" warnings.

---

### Day 3: Add Error Boundaries (4 hours)

**What:** Prevent React errors from crashing the entire page.

**Steps:**
1. Create `components/ErrorBoundary.tsx` (see full plan for code)
2. Add to `app/layout.tsx`:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

3. Test by throwing intentional error
4. Deploy

**Success Criteria:** Errors show friendly message instead of blank page.

---

### Days 4-5: Set Up Testing (6 hours)

**What:** Create Firestore rules tests to catch issues before deployment.

**Steps:**
1. Create `tests/security/firestore-rules.test.ts` (see full plan)
2. Run tests:
```bash
firebase emulators:exec --only firestore "npm run test:security"
```

3. Create pre-deployment validation script:
```bash
# Create scripts/validate-firestore.js
node scripts/validate-firestore.js
```

4. Make it block deployments on failure

**Success Criteria:** Tests pass, pre-deploy validation works.

---

## Week 2: DEPLOYMENT SAFETY (High Priority)

### Days 1-2: Create Schema Constants (6 hours)

**What:** Type-safe collection and field names to prevent typos.

**Steps:**
1. Create `lib/firestore-schema.ts`:
```typescript
export const COLLECTIONS = {
  CONTENT: 'content',
  USERS: 'users',
  MESSAGES: 'messages',
  // ... etc
} as const

export const FIELDS = {
  CONTENT: {
    CREATOR_UID: 'creatorUid',
    STATUS: 'status',
    SPORT: 'sport',
  }
} as const
```

2. Update all API routes to use constants:
```typescript
// OLD
.collection('lessons')
.where('coachId', '==', uid)

// NEW
import { COLLECTIONS, FIELDS } from '@/lib/firestore-schema'
.collection(COLLECTIONS.CONTENT)
.where(FIELDS.CONTENT.CREATOR_UID, '==', uid)
```

3. Create validation script to catch violations

**Success Criteria:** TypeScript errors if wrong collection/field name used.

---

### Days 3-5: Staging Environment (8 hours)

**What:** Test all changes in staging before production.

**Steps:**
1. Create staging Firebase project
2. Set up Vercel staging environment
3. Create deployment script:
```bash
# scripts/deploy-staging.sh
- Run tests
- Deploy to staging Firebase
- Deploy to staging Vercel
- Show verification checklist
```

4. Document verification checklist
5. Train team on staging workflow

**Success Criteria:** All future deployments go through staging first.

---

## Week 3: MONITORING (High Priority)

### Days 1-2: Set Up Error Monitoring (6 hours)

**What:** Know about errors before users report them.

**Steps:**
1. Install Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

2. Configure Sentry (see full plan for config)
3. Add error tracking to API routes:
```typescript
import { trackError } from '@/lib/error-tracking'

catch (error) {
  trackError(error, {
    userId: uid,
    action: 'fetch_analytics',
    collection: 'content'
  })
}
```

4. Set up Slack/email alerts for critical errors

**Success Criteria:** Errors appear in Sentry dashboard, alerts work.

---

### Days 3-4: Query Performance Monitoring (5 hours)

**What:** Track slow queries and errors.

**Steps:**
1. Create `lib/firestore-monitor.ts` (see full plan)
2. Wrap all queries:
```typescript
const snapshot = await firestoreMonitor.trackQuery(
  'list',
  'content',
  () => db.collection('content').where(...).get(),
  userId
)
```

3. Set up dashboard to view metrics

**Success Criteria:** Slow queries logged, performance tracked.

---

### Day 5: Configure Alerts (3 hours)

**What:** Get notified immediately when issues occur.

**Steps:**
1. Configure Sentry alerts:
   - High error rate (>50 errors/5min)
   - New error types
   - Performance degradation (>5s response)

2. Configure Firebase alerts:
   - Firestore errors >10/min
   - Auth failures >20/min
   - Rule violations >5/min

3. Test alerts

**Success Criteria:** Team receives alerts for critical issues.

---

## Week 4: DOCUMENTATION (Medium Priority)

### Days 1-2: Database Schema Docs (4 hours)

**What:** Single source of truth for database structure.

**Steps:**
1. Create `docs/DATABASE_SCHEMA.md` documenting:
   - All collections
   - Field names (with correct names highlighted)
   - Deprecated names to avoid
   - Required indexes
   - Common queries
   - Security rules

2. Add examples of correct usage

**Success Criteria:** Developers can reference docs instead of guessing.

---

### Days 3-4: API Documentation (4 hours)

**What:** Document all API endpoints.

**Steps:**
1. Create `docs/API_REFERENCE.md` with:
   - All endpoints
   - Request/response formats
   - Error codes
   - Firestore collections used
   - Required indexes

2. Add to PR template: "Update API docs if endpoint changed"

**Success Criteria:** New developers can understand API from docs.

---

### Day 5: Process Documentation (2 hours)

**What:** Document deployment and rollback procedures.

**Steps:**
1. Create PR template with checklist
2. Document rollback procedures
3. Create code review checklist
4. Set up pre-commit hooks

**Success Criteria:** Team follows consistent process.

---

## Priority Matrix

### Do Immediately (Week 1)
1. ✅ Fix collection name bug (Day 1)
2. ✅ Add missing indexes (Day 2)
3. ✅ Add error boundaries (Day 3)
4. ✅ Set up basic testing (Days 4-5)

### Do Soon (Week 2)
5. ✅ Create schema constants (Days 1-2)
6. ✅ Set up staging environment (Days 3-5)

### Do This Month (Week 3)
7. ✅ Error monitoring (Days 1-2)
8. ✅ Query monitoring (Days 3-4)
9. ✅ Configure alerts (Day 5)

### Do When Possible (Week 4)
10. ⏭ Database schema docs (Days 1-2)
11. ⏭ API documentation (Days 3-4)
12. ⏭ Process documentation (Day 5)

---

## Daily Checklist Template

Use this for each work day:

```
Date: _________
Focus: _________

Morning (2 hours):
- [ ] Task 1
- [ ] Task 2

Afternoon (2 hours):
- [ ] Task 3
- [ ] Test changes

End of Day:
- [ ] Commit code
- [ ] Update team
- [ ] Plan tomorrow

Blockers: _________
```

---

## Quick Wins (Can Do in 1 Hour Each)

If you only have an hour, do these in order:

1. **Hour 1**: Fix analytics collection name bug (immediate impact)
2. **Hour 2**: Deploy missing indexes (prevents query failures)
3. **Hour 3**: Add error boundary to main layout (better UX)
4. **Hour 4**: Create `firestore-schema.ts` constants file
5. **Hour 5**: Install and configure Sentry
6. **Hour 6**: Create pre-deployment validation script
7. **Hour 7**: Document database schema for content collection
8. **Hour 8**: Set up staging environment

---

## What to Do Right Now

### If you have 30 minutes:
1. Read this entire document
2. Read the full prevention plan
3. Schedule team meeting to discuss implementation

### If you have 2 hours:
1. Fix the collection name bug (Day 1 task)
2. Deploy to production
3. Verify fix works

### If you have 4 hours:
1. Fix collection name bug
2. Add missing indexes
3. Test everything
4. Deploy to production

### If you have a full day:
Complete all Week 1, Day 1-3 tasks (critical fixes).

---

## Team Assignments

**Developer 1 (Backend Focus):**
- Week 1: Fix collection bugs, add indexes
- Week 2: Create schema constants, API testing
- Week 3: Set up query monitoring
- Week 4: API documentation

**Developer 2 (Frontend Focus):**
- Week 1: Add error boundaries, test UI
- Week 2: Staging environment setup
- Week 3: Error monitoring (Sentry)
- Week 4: Process documentation

**Developer 3 (DevOps Focus):**
- Week 1: Pre-deployment scripts
- Week 2: CI/CD pipeline updates
- Week 3: Alert configuration
- Week 4: Rollback procedures

---

## Success Checkpoints

### End of Week 1:
- [ ] No production errors related to collection names
- [ ] All Firestore queries have indexes
- [ ] Error boundaries prevent blank screens
- [ ] Basic test suite running

### End of Week 2:
- [ ] All code uses schema constants
- [ ] Staging environment operational
- [ ] Pre-deployment validation blocks bad deploys
- [ ] Team trained on new process

### End of Week 3:
- [ ] Error monitoring active (Sentry)
- [ ] Query performance tracked
- [ ] Alerts configured and tested
- [ ] Team receiving monitoring updates

### End of Week 4:
- [ ] Complete documentation
- [ ] PR template enforces checks
- [ ] Code review process in place
- [ ] Rollback procedures tested

---

## Emergency Shortcuts

If you need to fix production RIGHT NOW:

### Quick Fix (15 minutes):
1. Open `app/api/coach/analytics/route.ts`
2. Change `'lessons'` to `'content'`
3. Change `'coachId'` to `'creatorUid'`
4. `git commit -m "fix: Use correct collection name in analytics API"`
5. `git push`
6. Deploy to Vercel

### Add Index (10 minutes):
1. Go to Firebase Console > Firestore > Indexes
2. Copy the index suggestion from error message
3. Click "Create Index"
4. Wait 5-15 minutes

### Rollback (5 minutes):
1. Go to Vercel Dashboard
2. Find previous working deployment
3. Click "Promote to Production"
4. Done

---

## Questions & Answers

### Q: Can we skip staging?
**A:** No. Staging caught this issue in testing. Always use staging.

### Q: Do we need all the monitoring?
**A:** Yes. We can't fix what we don't know is broken.

### Q: Can we deploy indexes separately?
**A:** Yes. Indexes can be deployed independently of code.

### Q: What if tests fail in CI?
**A:** Deployment is blocked. Fix the issue first.

### Q: How long do indexes take to build?
**A:** 5-15 minutes typically. Check Firebase Console.

---

## Resources

- **Full Prevention Plan**: `PREVENTION_PLAN.md` (in same directory)
- **Firebase Console**: https://console.firebase.google.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Sentry**: https://sentry.io (after setup)

---

## Next Steps

1. Read this document (done!)
2. Schedule team meeting to discuss
3. Assign tasks to team members
4. Start with Week 1, Day 1 tasks
5. Update this checklist as you progress

---

**Last Updated:** 2024-10-10
**Estimated Completion:** 2024-11-07 (4 weeks)
