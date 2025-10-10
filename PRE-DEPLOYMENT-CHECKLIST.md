# Pre-Deployment Checklist for GAMEPLAN

**Last Updated:** 2025-10-10
**Target Deployment Date:** ___________

---

## ✅ Critical Infrastructure

### Firestore Indexes
- [x] All 12 composite indexes deployed
- [x] Single-field index for `content.createdAt` enabled
- [ ] All indexes show "Enabled" status in Firebase Console
- [ ] No "Building" or "Error" status indexes

**Verification:**
```bash
node create-missing-indexes.js
# Should show: Deployed: 13, Missing: 0
```

**Firebase Console:**
https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes

---

### Security Rules
- [ ] Firestore rules tested
- [ ] Storage rules reviewed
- [ ] Auth rules verified
- [ ] No security vulnerabilities

**Test:**
```bash
firebase emulators:start --only firestore
npm run test:security
```

---

### Environment Variables
- [ ] `.env.local` configured for development
- [ ] `.env.production` configured for production
- [ ] All API keys valid and not expired
- [ ] Firebase config correct
- [ ] Gemini/OpenAI keys working

**Check:**
```bash
npm run build
# Look for "✅ Environment validation successful"
```

---

## ✅ Code Quality

### Build Status
- [ ] `npm run build` completes without errors
- [ ] TypeScript compilation successful
- [ ] No critical linting errors
- [ ] Bundle size acceptable (<500KB initial load)

**Run:**
```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
```

---

### Known Issues Fixed
- [ ] Collection name bug fixed (`lessons` → `content`)
- [ ] Field name bug fixed (`coachId` → `creatorUid`)
- [ ] Analytics API working
- [ ] Lessons loading correctly
- [ ] No blank screens / error boundaries working

**Files to check:**
- `app/api/coach/analytics/route.ts:49-50`
- `app/api/coach/lessons/list/route.ts`

---

### Critical User Flows Working
- [ ] User login/signup
- [ ] Coach can create lesson
- [ ] Coach can view analytics
- [ ] Athlete can view lessons
- [ ] Admin can view dashboard
- [ ] No console errors on key pages

---

## ✅ Performance

### Page Load Times
- [ ] Homepage < 2 seconds
- [ ] Dashboard < 3 seconds
- [ ] Lessons page < 2 seconds
- [ ] No slow queries (all use indexes)

**Test with:**
- Chrome DevTools → Network tab
- Lighthouse score > 80

---

### API Response Times
- [ ] `/api/coach/analytics` < 500ms
- [ ] `/api/coach/lessons/list` < 500ms
- [ ] `/api/feature-flags` < 200ms
- [ ] All queries using proper indexes

---

## ✅ Data Integrity

### Database State
- [ ] No orphaned documents
- [ ] All required fields present
- [ ] Correct collection names used
- [ ] creatorUid fields populated (not coachId)

**Verify:**
```bash
# Check for incorrect field names
firebase firestore:get /content --limit 5
# Verify has creatorUid, not coachId
```

---

### Migration Status
- [ ] Old `lessons` collection migrated to `content`
- [ ] Old `coachId` fields migrated to `creatorUid`
- [ ] All users have correct roles
- [ ] No missing data

---

## ✅ Monitoring & Alerts

### Error Monitoring
- [ ] Sentry installed and configured (optional)
- [ ] Error boundaries added
- [ ] API error tracking working
- [ ] Console.log statements removed from production code

---

### Logging
- [ ] Important actions logged
- [ ] Errors logged with context
- [ ] No sensitive data in logs
- [ ] Log levels appropriate

---

## ✅ Deployment Process

### Pre-Deployment
- [ ] Code reviewed
- [ ] Tests passing
- [ ] No TODO comments for critical features
- [ ] Changelog updated
- [ ] Team notified of deployment

---

### Staging Deployment (if applicable)
- [ ] Deployed to staging environment
- [ ] All critical flows tested in staging
- [ ] Performance acceptable in staging
- [ ] No errors in staging logs

---

### Production Deployment
- [ ] Database backup created
- [ ] Deployment time scheduled (low traffic)
- [ ] Rollback plan documented
- [ ] Team available for monitoring

**Deploy commands:**
```bash
# Build production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy Firestore rules
firebase deploy --only firestore:rules --project gameplan-787a2

# Deploy Firestore indexes (already done)
firebase deploy --only firestore:indexes --project gameplan-787a2
```

---

### Post-Deployment
- [ ] Verify homepage loads
- [ ] Test login/signup
- [ ] Check critical dashboards
- [ ] Monitor error rates (first 30 min)
- [ ] Check Firebase Console for errors
- [ ] Verify indexes still enabled

---

## ✅ Documentation

- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Deployment process documented
- [ ] Rollback procedures documented
- [ ] Known issues documented

---

## ✅ Rollback Plan

### If Issues Detected

**Immediate rollback (< 5 minutes):**
```bash
# Rollback Vercel deployment
vercel promote [previous-deployment-url] --prod

# Rollback Firestore rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules --project gameplan-787a2
```

**Partial rollback:**
- Feature flags to disable new features
- Database rollback if data corruption
- Revert specific commits

---

## 🔍 Final Pre-Deployment Checks

### 15 Minutes Before Deployment
1. [ ] Run full build: `npm run build`
2. [ ] Check all indexes enabled
3. [ ] Verify no active incidents
4. [ ] Team in Slack/ready to monitor
5. [ ] Low user traffic confirmed

### 5 Minutes Before Deployment
1. [ ] Final code review
2. [ ] Backup database
3. [ ] Note current deployment URL
4. [ ] Clear any caches
5. [ ] Deep breath 😊

### During Deployment
1. [ ] Watch build logs
2. [ ] Monitor error rates
3. [ ] Test critical flows immediately
4. [ ] Check user reports
5. [ ] Keep rollback command ready

### 30 Minutes After Deployment
1. [ ] Error rate normal
2. [ ] Page load times acceptable
3. [ ] No user complaints
4. [ ] All critical features working
5. [ ] Announce success to team

---

## 📊 Success Criteria

**Deployment is successful if:**
- ✅ Error rate < 0.1%
- ✅ Page load times < 3 seconds
- ✅ All critical user flows working
- ✅ No Firestore index errors
- ✅ No authentication errors
- ✅ Dashboard loads correctly
- ✅ Analytics display correctly
- ✅ Lessons load correctly

**Rollback if:**
- ❌ Error rate > 1%
- ❌ Critical features broken
- ❌ Data integrity issues
- ❌ Performance degradation > 50%
- ❌ Unable to login
- ❌ Blank screens / crashes

---

## 📝 Notes

### Current Known Issues
1. ~~Collection name bug (`lessons` → `content`)~~ ✅ FIXED
2. ~~Missing Firestore indexes~~ ✅ FIXED
3. API routes show "Dynamic server usage" warnings during build (NORMAL - not an error)

### Recent Changes
- 2025-10-10: Created all 12 Firestore indexes
- 2025-10-10: Fixed collection name spacing issue
- 2025-10-10: Created deployment automation scripts

### Team Contacts
- **Technical Lead:** ___________
- **On-Call Engineer:** ___________
- **Product Manager:** ___________

---

## 🚀 Deployment Commands Reference

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Deploy to Vercel
vercel --prod

# Deploy Firebase
firebase deploy --only firestore --project gameplan-787a2

# Check indexes
node create-missing-indexes.js

# Rollback Vercel
vercel promote [url] --prod

# Rollback Firebase
firebase deploy --only firestore:rules --project gameplan-787a2
```

---

**Deployment Approval:**
- [ ] Technical Lead: ___________
- [ ] Product Manager: ___________
- [ ] QA Lead: ___________

**Date:** ___________
**Time:** ___________
**Deployed By:** ___________

---

**Post-Deployment Review Date:** ___________
