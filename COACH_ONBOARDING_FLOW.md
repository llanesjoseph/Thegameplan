# Coach Onboarding Flow - Complete Documentation

## 🎯 Overview
This document explains the complete flow from when a new coach is added to when they appear in the "Browse Coaches" section.

## 📋 Complete Flow Steps

### 1. Coach Invitation/Application
- **Admin creates invitation** or **Coach applies directly**
- **Invitation stored** in `invitations` collection
- **Application stored** in `coach_applications` collection

### 2. Profile Completion
When a coach completes their profile, the system automatically:

#### A. Creates User Account
- **Creates Firebase Auth user** with email/password
- **Sets custom claims** for role-based access
- **Creates user document** in `users` collection

#### B. Creates Coach Profile
- **Creates profile** in `creator_profiles` collection
- **Sets profile data** (name, sport, specialties, etc.)
- **Marks as active** (`isActive: true`)

#### C. Syncs to Public Profile (NEW!)
- **Automatically calls** `syncCoachToPublicProfile()`
- **Creates entry** in `creators_index` collection
- **Creates entry** in `creatorPublic` collection (legacy)
- **Updates coach count cache**

### 3. Browse Coaches Visibility
- **Coach appears immediately** in Browse Coaches page
- **Count updates automatically** to reflect new coach
- **Profile data synced** with latest information

## 🔧 Technical Implementation

### API Endpoints That Trigger Sync

#### 1. `/api/complete-coach-profile` (Profile Completion)
```typescript
// After creating creatorPublic profile
const syncData = {
  uid: userRecord.uid,
  email: coachProfile.email?.toLowerCase(),
  displayName: coachProfile.displayName,
  // ... other profile data
  isActive: true,
  profileComplete: true,
  status: 'approved',
  verified: true,
  featured: false
}

const syncSuccess = await syncCoachToPublicProfile(syncData)
```

#### 2. `/api/admin/approve-simple-coach` (Admin Approval)
```typescript
// After creating creatorPublic profile
if (role === 'coach' || role === 'creator') {
  const syncData = {
    uid: userRecord.uid,
    email: email.toLowerCase(),
    displayName: displayName,
    // ... other profile data
    isActive: true,
    profileComplete: true,
    status: 'approved',
    verified: true,
    featured: false
  }
  
  await syncCoachToPublicProfile(syncData)
}
```

#### 3. `/api/admin/approve-coach-invitation` (Already Working)
- **Already creates** `creators_index` entry directly
- **No sync needed** - works correctly

### Sync Function Details

#### `syncCoachToPublicProfile()` Function
- **Location**: `lib/sync-coach-to-public-profile.ts`
- **Purpose**: Syncs coach data to public profiles
- **Collections Updated**:
  - `creators_index` (primary for Browse Coaches)
  - `creatorPublic` (legacy compatibility)
- **Features**:
  - **Visibility controls** (public/private fields)
  - **Automatic coach count update**
  - **Audit logging**
  - **Error handling**

### Active Coach Criteria

A coach appears in Browse Coaches when ALL of these are true:
1. ✅ `isActive === true` (Coach is ready to coach)
2. ✅ `profileComplete === true` (Profile is complete)
3. ✅ `status === 'approved'` (Application approved)
4. ✅ Has at least ONE of: tagline, bio, or specialties

## 🚀 Expected Results

### When a New Coach Completes Profile:
1. **Immediate visibility** in Browse Coaches page
2. **Accurate coach count** updates automatically
3. **Complete profile data** displayed correctly
4. **No manual intervention** required

### When Admin Approves Coach:
1. **Same immediate visibility** as profile completion
2. **Consistent data** across all collections
3. **Proper role assignment** and permissions
4. **Email notifications** sent automatically

## 🔍 Troubleshooting

### Coach Not Appearing in Browse Coaches?
1. **Check `creators_index` collection** - should have coach entry
2. **Verify active criteria** - all 4 conditions must be true
3. **Check console logs** - look for sync success/failure messages
4. **Run manual sync** - use admin sync tools if needed

### Count Not Updating?
1. **Check `system_cache/coach_count`** - should have accurate count
2. **Run coach count update** - `/api/cron/update-coach-count`
3. **Verify active coaches** - filter by criteria above

### Data Inconsistencies?
1. **Check all collections** - `users`, `creator_profiles`, `creators_index`
2. **Run data consistency checks** - admin tools available
3. **Manual sync** - use admin sync tools to fix

## 📊 Monitoring

### Success Indicators:
- ✅ Coach appears in Browse Coaches immediately
- ✅ Coach count updates automatically
- ✅ Profile data is complete and accurate
- ✅ No console errors during sync process

### Failure Indicators:
- ❌ Coach not visible in Browse Coaches
- ❌ Count shows incorrect number
- ❌ Console errors during sync
- ❌ Missing data in `creators_index`

## 🎉 Summary

The complete flow now ensures that:
- **New coaches appear immediately** in Browse Coaches
- **No manual intervention** required
- **Data stays consistent** across all collections
- **Count updates automatically**
- **Full audit trail** of all changes

This creates a seamless experience where coaches go from profile completion to being discoverable by athletes instantly!
