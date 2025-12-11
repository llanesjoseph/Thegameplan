# Analytics Implementation Guide

## Overview

This guide shows you how to implement comprehensive analytics tracking in your Next.js + Firebase app.

## What Gets Tracked

### 1. API & Server Health
- ✅ Error rates (4xx, 5xx)
- ✅ API response times (average, p95, p99)
- ✅ Request throughput (requests per second)
- ✅ Success/failure rates

### 2. Business & User Logic
- ✅ User authentication (login, signup, password reset)
- ✅ Core business actions (video submissions, lessons, messages, etc.)
- ✅ Custom events you define

### 3. Bug Reporter Health
- ✅ Form funnel (viewed → started → submitted/failed)
- ✅ Completion and abandonment rates

### 4. Page Tracking
- ✅ Time on page
- ✅ Scroll depth
- ✅ User interactions (clicks, keypresses)
- ✅ Page load performance

### 5. Error Tracking
- ✅ JavaScript errors
- ✅ Unhandled promise rejections
- ✅ API errors

---

## Implementation Steps

### Step 1: Add Analytics to API Routes

Wrap any API route handler with `withAPIAnalytics`:

```typescript
// app/api/your-endpoint/route.ts
import { withAPIAnalytics } from '@/lib/api-analytics-middleware'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withAPIAnalytics(async (request: NextRequest) => {
  // Your API logic here
  const data = await fetchSomeData()

  return NextResponse.json({ success: true, data })
})

export const POST = withAPIAnalytics(async (request: NextRequest) => {
  const body = await request.json()

  // Your logic

  return NextResponse.json({ success: true })
})
```

**This automatically tracks:**
- Response time
- Status codes
- Errors (4xx, 5xx)

---

### Step 2: Add Page Analytics

Add the `usePageAnalytics()` hook to any page:

```typescript
// app/dashboard/page.tsx
'use client'

import { usePageAnalytics } from '@/hooks/use-page-analytics'

export default function DashboardPage() {
  usePageAnalytics() // Add this line

  return (
    <div>Your page content</div>
  )
}
```

**This automatically tracks:**
- Time spent on page
- Scroll depth
- User interactions
- Page load performance
- JavaScript errors

---

### Step 3: Track Business Actions

Use the provided helpers or create custom events:

```typescript
import { BusinessActions, trackBusinessAction } from '@/lib/analytics-service'

// Example: Track video submission
await BusinessActions.videoSubmitted(userId, {
  coachId: coachId,
  sport: 'soccer',
  duration: 120
})

// Example: Track lesson completion
await BusinessActions.lessonCompleted(userId, lessonId)

// Example: Custom business action
await trackBusinessAction('purchase.completed', userId, {
  amount: 99.99,
  product: 'premium-plan'
})
```

---

### Step 4: Track Authentication Events

```typescript
import { trackAuth } from '@/lib/analytics-service'

// On successful login
await trackAuth('login_success', userId, {
  method: 'google',
  newUser: false
})

// On failed login
await trackAuth('login_failure', undefined, {
  reason: 'invalid_password'
})

// On signup
await trackAuth('signup_success', newUserId, {
  method: 'email',
  sport: 'basketball'
})

// On password reset
await trackAuth('password_reset', userId)
```

---

### Step 5: Track Bug Reporter

Add analytics to your bug reporter form:

```typescript
import { useBugReporterAnalytics } from '@/hooks/use-bug-reporter-analytics'

export default function BugReporter({ isOpen }) {
  const {
    trackFormViewed,
    trackFormStarted,
    trackFormSubmitted,
    trackFormFailed
  } = useBugReporterAnalytics()

  // Track when form opens
  useEffect(() => {
    if (isOpen) {
      trackFormViewed()
    }
  }, [isOpen])

  // Track when user starts typing
  const handleFieldChange = (e) => {
    trackFormStarted() // Only fires once
    setValue(e.target.value)
  }

  // Track submission
  const handleSubmit = async () => {
    try {
      await submitBugReport(formData)
      trackFormSubmitted({ category: formData.category })
    } catch (error) {
      trackFormFailed(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleFieldChange} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## Step 6: Update Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Analytics events collection
match /analytics_events/{eventId} {
  // Allow authenticated users to create events
  allow create: if isAuthenticated();

  // Only admins can read analytics
  allow read: if isAdmin();

  // Analytics are immutable
  allow update, delete: if false;
}

// Analytics aggregations (for dashboard queries)
match /analytics_aggregations/{aggId} {
  // Only system/Cloud Functions can write
  allow create, update: if false;

  // Only admins can read
  allow read: if isAdmin();
}
```

---

## Viewing Analytics Data

### Option 1: Firestore Console (Simple)

1. Go to Firebase Console → Firestore Database
2. Navigate to `analytics_events` collection
3. Filter by:
   - `category`: 'api_health', 'user_auth', 'business_action', etc.
   - `action`: Specific action name
   - `timestamp`: Date range

### Option 2: Build a Dashboard (Recommended)

Create an admin dashboard page to view analytics:

```typescript
// app/dashboard/admin/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export default function AnalyticsDashboard() {
  const [errorRate, setErrorRate] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)

  useEffect(() => {
    async function loadMetrics() {
      // Get API errors from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const errorsQuery = query(
        collection(db, 'analytics_events'),
        where('category', '==', 'error'),
        where('timestamp', '>=', yesterday),
        orderBy('timestamp', 'desc'),
        limit(100)
      )

      const snapshot = await getDocs(errorsQuery)
      setErrorRate(snapshot.size)

      // Calculate average response time
      const apiQuery = query(
        collection(db, 'analytics_events'),
        where('category', '==', 'api_health'),
        where('timestamp', '>=', yesterday),
        limit(1000)
      )

      const apiSnapshot = await getDocs(apiQuery)
      const times = apiSnapshot.docs.map(d => d.data().value || 0)
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      setAvgResponseTime(Math.round(avg))
    }

    loadMetrics()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Errors (24h)</h3>
          <p className="text-3xl font-bold">{errorRate}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Avg Response Time</h3>
          <p className="text-3xl font-bold">{avgResponseTime}ms</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Key Metrics to Monitor

### API Health
- **5xx Errors**: Should be near zero. Alert if > 10 per hour.
- **4xx Errors**: Monitor for sudden spikes (bad deployment).
- **Response Time p95**: Should be < 500ms for good UX.
- **Throughput**: Track normal patterns, alert on unusual spikes.

### Business Metrics
- **Login Success Rate**: Should be > 95%.
- **Signup Completion**: Track funnel drop-off.
- **Core Actions**: Define your app's most important actions and track them.

### Bug Reporter
- **Form Completion Rate**: `(submitted / started) * 100`
- **Form Abandonment Rate**: `(started - submitted) / started * 100`
- Target: > 80% completion rate

### Page Tracking
- **Avg Time on Page**: Indicates engagement.
- **Bounce Rate**: Users who leave < 10 seconds.
- **Scroll Depth**: Are users seeing your content?

---

## Best Practices

1. **Don't track PII**: Never log passwords, credit cards, SSNs, etc.
2. **Sample for high traffic**: If you have 1M+ events/day, sample at 10-20%.
3. **Set up alerts**: Use Firebase Cloud Functions to alert on critical metrics.
4. **Regular reviews**: Check your dashboard weekly to spot trends.
5. **Clean old data**: Archive events older than 90 days.

---

## Costs & Performance

### Firestore Costs
- **Writes**: ~$0.18 per 100K events
- **Reads**: ~$0.06 per 100K reads (dashboard queries)
- **Storage**: ~$0.18/GB/month

### Performance Impact
- All tracking is asynchronous (non-blocking)
- Failed tracking doesn't break your app
- Minimal overhead: ~5-10ms per event

---

## Troubleshooting

### Events not appearing in Firestore?

1. Check Firestore security rules allow writes
2. Check browser console for errors
3. Verify Firebase initialization in `lib/firebase.client.ts`
4. Check that `analytics_events` collection exists

### High costs?

1. Reduce sampling rate for high-volume events
2. Aggregate data in Cloud Functions (run hourly/daily)
3. Archive old events to Cloud Storage

### Slow dashboard queries?

1. Add composite indexes for common queries
2. Use aggregated data instead of raw events
3. Limit date ranges in queries

---

## Next Steps

1. ✅ Implement tracking in 2-3 key pages
2. ✅ Add tracking to 2-3 important API routes
3. ✅ Build a simple dashboard to view your data
4. ✅ Set up alerts for critical metrics (Cloud Functions)
5. ✅ Review weekly and adjust tracking as needed
