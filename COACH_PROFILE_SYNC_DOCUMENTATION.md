# Coach Profile Sync & Count System Documentation

## Overview
This document explains how the automated coach profile sync and count system works in plain English.

## Feature 1: Immediate Profile Updates

### What It Does
When a coach's data is ingested (collected) into the system, their public profile is **immediately and automatically** updated so they appear on the Browse Coaches page right away.

### How It Works

#### 1. Direct Connection
- **File**: `lib/sync-coach-to-public-profile.ts`
- **Function**: `syncCoachToPublicProfile()`
- When coach data is saved, this function is automatically called
- It writes to two collections:
  - `creators_index` - Main collection for Browse Coaches page
  - `creatorPublic` - Legacy collection for backward compatibility

#### 2. Immediate Updates
- **Integration Point**: `lib/coach-profile-auto-population.ts` (lines 127-146)
- After a coach profile is created/updated, the system immediately syncs to public profiles
- No manual approval or sync needed - it happens automatically

#### 3. Data Overwrites
- New data from ingestion **replaces** old data in the public profile
- Example: If ingestion data says `status: "Active"`, the public profile will show "Active"
- All profile fields are kept in sync with the latest ingested data

#### 4. Public/Private Visibility Controls
- **Visibility Settings**: Each coach profile has a `visibility` object
- Fields can be marked as public or private:
  ```typescript
  visibility: {
    tagline: true,      // Public
    bio: true,          // Public
    philosophy: false,  // Private
    credentials: true,  // Public
    specialties: true,  // Public
    achievements: true, // Public
    heroImage: true,    // Public
    headshot: true      // Public
  }
  ```
- Only fields marked as public (`true` or undefined) appear on the public profile
- Fields marked as `false` are hidden from the public

### Files Changed
1. **Created**: `lib/sync-coach-to-public-profile.ts` - Sync logic
2. **Updated**: `lib/coach-profile-auto-population.ts` - Calls sync after profile creation
3. **Collections Used**:
   - `creators_index` - Primary public profiles
   - `creatorPublic` - Legacy public profiles
   - `coach_profiles` - Private coach data

---

## Feature 2: Automated Coach Count

### What It Does
The "Browse X Coaches" number on the public page is automatically kept in perfect sync with the actual number of active coaches.

### Active Coach Criteria

A coach is considered **ACTIVE** when ALL of these are true:
1. ✅ `isActive === true` (Coach is ready to coach)
2. ✅ `profileComplete === true` (Profile is complete)
3. ✅ `status === 'approved'` (Application approved)
4. ✅ Has at least ONE of: tagline, bio, or specialties

**Example Active Coach:**
```typescript
{
  isActive: true,
  profileComplete: true,
  status: 'approved',
  tagline: 'Elite soccer training',
  bio: 'Former professional player...',
  specialties: ['technical', 'tactical']
}
```

**Example Inactive Coach:**
```typescript
{
  isActive: false,           // ❌ Not active
  profileComplete: false,    // ❌ Incomplete profile
  status: 'pending',         // ❌ Not approved
  tagline: '',               // ❌ No content
  bio: '',
  specialties: []
}
```

### How It Works

#### 1. Automated Counting
- **File**: `app/api/cron/update-coach-count/route.ts`
- **Cron Job**: Runs automatically on a schedule (e.g., every 15 minutes)
- **Manual Trigger**: Can also be triggered via `POST /api/cron/update-coach-count`

#### 2. Count Process
```
1. Query creators_index for isActive === true
2. Filter results by our Active Criteria
3. Count the filtered coaches
4. Save count to system_cache/coach_count
```

#### 3. Cache Storage
- **Collection**: `system_cache`
- **Document**: `coach_count`
- **Data Stored**:
  ```typescript
  {
    activeCoaches: 150,        // Number shown to public
    totalCoaches: 200,         // Total in database
    lastUpdated: Date,         // When count was updated
    criteria: {                // Rules used for counting
      description: "Active coaches with completed profiles",
      rules: [...]
    }
  }
  ```

#### 4. Display on Website
- **File**: `app/coaches/page.tsx` (lines 135-148, 263)
- Instead of counting coaches on every page load (slow!), the page reads the cached number (fast!)
- The title displays: "Browse 150 Elite Coaches" using the cached count
- **Fallback**: If cache is unavailable, falls back to real-time counting

### Performance Benefits
- **Before**: Counted coaches on every page visit (slow, expensive)
- **After**: Reads cached number (instant, free)
- **Update Frequency**: Every 15 minutes (configurable)
- **Freshness**: Count is never more than 15 minutes old

### Files Changed
1. **Created**: `app/api/cron/update-coach-count/route.ts` - Count automation
2. **Updated**: `app/coaches/page.tsx` - Uses cached count
3. **Collection Used**: `system_cache/coach_count` - Stores the count

---

## Testing the System

### Test Feature 1: Profile Sync
1. Ingest a new coach via `/api/coach-ingestion/submit`
2. Check `creators_index` collection - coach should appear immediately
3. Visit `/coaches` page - coach should be visible

### Test Feature 2: Coach Count
1. Trigger the count update: `POST /api/cron/update-coach-count`
2. Check `system_cache/coach_count` document
3. Visit `/coaches` page - title should show the count
4. Console should log: `📊 Loaded cached coach count: X active`

---

## Cron Job Setup

To run the coach count automatically, set up a cron job or scheduled task:

### Option 1: Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/update-coach-count",
    "schedule": "*/15 * * * *"
  }]
}
```

### Option 2: External Cron Service
Use services like:
- **Cron-job.org**: Free cron service
- **EasyCron**: Reliable cron service
- **Google Cloud Scheduler**: Enterprise option

Set up a GET or POST request to:
```
https://your-domain.com/api/cron/update-coach-count
```

Run every 15 minutes: `*/15 * * * *`

---

## Monitoring & Logs

### Success Indicators
```
✅ Synced John Doe to creators_index
✅ Synced John Doe to creatorPublic
✅ Coach count updated: 150 active coaches (200 total)
📊 Loaded cached coach count: 150 active
```

### Error Indicators
```
❌ Failed to sync coach to public profile
⚠️ Failed to update coach count cache
⚠️ Failed to load cached count, falling back to real-time count
```

---

## Collections Reference

| Collection | Purpose | Who Reads It |
|------------|---------|--------------|
| `coach_applications` | Ingested coach data | Admin only |
| `coach_profiles` | Complete coach profiles (private) | Authenticated coaches |
| `creators_index` | Public coach profiles | Browse Coaches page |
| `creatorPublic` | Legacy public profiles | Backward compatibility |
| `system_cache` | Cached counts and stats | Public pages (performance) |

---

## Summary

1. **Immediate Sync**: Coach data → Public profile (automatic, instant)
2. **Visibility Control**: Public/private field settings respected
3. **Active Criteria**: Clear rules for what makes a coach "active"
4. **Automated Count**: Runs on schedule, updates cache
5. **Fast Display**: Website reads cached count (no expensive queries)
6. **Fallback**: If cache fails, falls back to real-time counting

**Result**: Coaches appear on the Browse page immediately after ingestion, and the count stays perfectly in sync!
