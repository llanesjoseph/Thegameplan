# Check Real Error - Most Efficient Method

## FASTEST: Check Vercel Logs (See Actual Error)

### Step 1: Go to Vercel Deployment Logs
https://vercel.com/joseph-llanes-projects/gameplan/deployments

### Step 2: Click Latest Deployment
Click on the most recent deployment (should be from today)

### Step 3: Click "Functions" Tab
Look for the Functions or Runtime Logs section

### Step 4: Filter for Errors
Look for logs from: `/api/coach/[id]/stats`

### Step 5: Find the Real Error
You'll see the actual error message - copy and paste it here

---

## ALTERNATIVE: Test API Directly

### Open Browser Console
1. Go to: https://playbookd.crucibleanalytics.dev/coach-profile/lona-vincent-US6fs1
2. Press F12 (open DevTools)
3. Go to "Console" tab
4. Refresh the page
5. Look for red error messages
6. Screenshot or copy the error

---

## NUCLEAR OPTION: Simplify the Code (Remove Dual Query)

If we can't figure out the error, we can simplify to just use ONE field:

### Edit: app/api/coach/[id]/stats/route.ts

Change lines 29-57 to this simple version:

```typescript
// Simplified - just use assignedCoachId
let totalAthletes = 0
try {
  const athletesSnapshot = await adminDb
    .collection('users')
    .where('assignedCoachId', '==', coachId)
    .get()

  totalAthletes = athletesSnapshot.size
} catch (error) {
  console.log('Could not query athletes:', error)
  totalAthletes = 0
}
```

This removes the parallel queries and just uses the field that's most likely to work.

---

## MY RECOMMENDATION:

**Check Vercel logs FIRST** - that will tell us the exact error and we can fix it properly instead of guessing.
