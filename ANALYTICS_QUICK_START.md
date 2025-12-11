# Analytics System - Quick Start

## ✅ What's Been Created

Your app now has a complete analytics system that tracks:

### 1. API & Server Health ⚡
- Response times (average, p95, p99)
- Error rates (4xx, 5xx status codes)
- Request throughput
- API success/failure rates

### 2. Business & User Logic 📊
- User authentication events
- Core business actions (customizable)
- Custom events you define

### 3. Bug Reporter Health 🐛
- Form funnel (viewed → started → submitted/failed)
- Completion and abandonment rates

### 4. Page Tracking 📄
- Time on page
- Scroll depth
- User interactions
- Page load performance

### 5. Error Tracking ⚠️
- JavaScript errors
- Unhandled promise rejections
- API errors

---

## 🚀 Quick Implementation (5 Minutes)

### Step 1: Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### Step 2: Add to One Page (Test It)

```typescript
// app/dashboard/page.tsx
'use client'

import { usePageAnalytics } from '@/hooks/use-page-analytics'

export default function DashboardPage() {
  usePageAnalytics() // ← Add this one line

  return <div>Your content</div>
}
```

### Step 3: Add to One API Route (Test It)

```typescript
// app/api/test/route.ts
import { withAPIAnalytics } from '@/lib/api-analytics-middleware'

export const GET = withAPIAnalytics(async (request) => {
  // Your logic
  return NextResponse.json({ success: true })
})
```

### Step 4: Check Firestore

1. Go to Firebase Console → Firestore
2. Open `analytics_events` collection
3. You should see events appearing! 🎉

---

## 📊 View Your Data

### Option 1: Firestore Console (Simple)
- Go to: Firebase Console → Firestore → `analytics_events`
- Filter by `category` field:
  - `api_health` - API metrics
  - `user_auth` - Login/signup events
  - `page_tracking` - Time on page, scroll depth
  - `error` - Errors and failures

### Option 2: Build a Dashboard
See `ANALYTICS_IMPLEMENTATION_GUIDE.md` for dashboard code examples.

---

## 🎯 Key Metrics to Watch

### Critical Alerts
- **5xx errors**: Should be near zero
- **Login failure rate**: Should be < 5%
- **Avg response time**: Should be < 500ms

### Important Trends
- **Time on page**: Higher = better engagement
- **Bug reporter completion rate**: Should be > 80%
- **API throughput**: Track normal patterns

---

## 📝 Common Use Cases

### Track a Video Submission
```typescript
import { BusinessActions } from '@/lib/analytics-service'

await BusinessActions.videoSubmitted(userId, {
  coachId: coachId,
  sport: 'soccer'
})
```

### Track User Login
```typescript
import { trackAuth } from '@/lib/analytics-service'

await trackAuth('login_success', userId, {
  method: 'google'
})
```

### Track Custom Action
```typescript
import { trackBusinessAction } from '@/lib/analytics-service'

await trackBusinessAction('purchase.completed', userId, {
  amount: 99.99,
  plan: 'premium'
})
```

---

## 📁 Files Created

### Core Services
- `lib/analytics-service.ts` - Main tracking functions
- `lib/api-analytics-middleware.ts` - Auto-track API routes

### React Hooks
- `hooks/use-page-analytics.ts` - Track time on page
- `hooks/use-bug-reporter-analytics.ts` - Track bug reports

### Documentation
- `ANALYTICS_IMPLEMENTATION_GUIDE.md` - Full guide
- `ANALYTICS_QUICK_START.md` - This file

### Security
- `firestore.rules` - Updated with analytics permissions

---

## 🔒 Security & Privacy

✅ **Safe to use**:
- All events are anonymous unless you pass a userId
- No PII is automatically collected
- Analytics data only accessible to admins

⚠️ **Don't track**:
- Passwords
- Credit card numbers
- Social security numbers
- Private medical data

---

## 💰 Cost Estimate

For a typical app with 10,000 users:
- **Firestore writes**: ~$5-10/month
- **Firestore reads**: ~$1-2/month (dashboard queries)
- **Storage**: ~$1/month

Total: **~$7-13/month** for complete analytics

---

## 🎓 Next Steps

1. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. ✅ Add `usePageAnalytics()` to 2-3 key pages
3. ✅ Wrap 2-3 API routes with `withAPIAnalytics`
4. ✅ Check Firestore for events (they should appear!)
5. ✅ Build a simple dashboard (see implementation guide)
6. ✅ Set up alerts for critical metrics

---

## 🆘 Need Help?

See the full guide: `ANALYTICS_IMPLEMENTATION_GUIDE.md`

### Common Issues

**Events not appearing?**
- Check Firestore rules: `firebase deploy --only firestore:rules`
- Check browser console for errors
- Verify Firebase is initialized

**Too expensive?**
- Reduce sampling rate for high-volume events
- Use aggregations instead of raw events
- Archive old data (> 90 days)

**Dashboard queries slow?**
- Add Firestore composite indexes
- Limit date ranges
- Use aggregated data

---

## 🎉 You're Done!

You now have production-ready analytics that tracks:
- ✅ API health and performance
- ✅ User behavior and engagement
- ✅ Business metrics
- ✅ Errors and failures
- ✅ Bug reporter effectiveness

Start with a few pages, then expand. Monitor weekly and adjust as needed!
