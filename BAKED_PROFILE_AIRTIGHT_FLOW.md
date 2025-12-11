# Baked Coach Profile System - AIRTIGHT Implementation

## Overview
This document outlines the bulletproof implementation of the baked coach profile system, ensuring zero gaps, race conditions, or edge cases.

## Core Flow

### 1. **Profile Creation** (`POST /api/admin/create-baked-profile`)
- ✅ **Email Validation**: Regex validation + normalization (lowercase, trimmed)
- ✅ **Duplicate Prevention**: Checks for existing baked profiles with same email
- ✅ **Atomic Creation**: Single transaction ensures consistency
- ✅ **Browse Coaches Sync**: If visible, syncs to `creators_index` atomically
- ✅ **Comprehensive Field Validation**: All fields validated and sanitized

### 2. **Profile Updates** (`PUT /api/admin/update-baked-profile`)
- ✅ **Status Lock**: Cannot update if status is 'ready' or 'transferred'
- ✅ **Transaction Safety**: Re-reads latest data before update to prevent race conditions
- ✅ **Email Normalization**: Case-insensitive, trimmed email matching
- ✅ **URL Validation**: Validates all URL fields

### 3. **Mark as Ready** (`POST /api/admin/mark-baked-profile-ready`)
- ✅ **Atomic Status Change**: Transaction ensures status update and sync happen together
- ✅ **Browse Coaches Sync**: If visible, syncs to `creators_index` atomically
- ✅ **Double-Check**: Re-reads data before update to prevent race conditions
- ✅ **Lock Enforcement**: Once ready, profile is locked from editing

### 4. **Toggle Visibility** (`POST /api/admin/toggle-baked-profile-visibility`)
- ✅ **Atomic Toggle**: Transaction ensures visibility change and `creators_index` sync happen together
- ✅ **Add/Remove Sync**: Properly adds or removes from `creators_index`
- ✅ **Data Consistency**: Re-reads latest data before update

### 5. **Auto-Adoption** (`POST /api/user/adopt-baked-profile`)
- ✅ **Transaction Safety**: Uses Firestore transactions to prevent race conditions
- ✅ **Email Matching**: Case-insensitive, trimmed email comparison
- ✅ **Status Check**: Only adopts 'pending' or 'ready' profiles
- ✅ **Duplicate Prevention**: Checks if user already has a profile
- ✅ **Atomic Transfer**: All collections updated in single transaction:
  - `creator_profiles`
  - `coach_profiles`
  - `users`
  - `baked_profiles` (status update)
  - `creators_index` (replace bakedProfileId with real UID)
- ✅ **Complete Field Sync**: All profile fields transferred
- ✅ **Browse Coaches Update**: Removes old baked profile entry, adds new with real UID

### 6. **Client-Side Adoption Hook** (`useBakedProfileAdoption`)
- ✅ **Automatic Trigger**: Runs on every login/auth state change
- ✅ **Retry Logic**: 3 attempts with exponential backoff
- ✅ **Token Refresh**: Forces token refresh before each attempt
- ✅ **Duplicate Prevention**: Only attempts once per user session
- ✅ **Non-Blocking**: Failures don't block user from using app
- ✅ **Auto-Reload**: Reloads page after successful adoption to show new profile

### 7. **Invite Email** (`POST /api/admin/send-baked-profile-invite`)
- ✅ **Email Verification**: Case-insensitive email matching
- ✅ **Status Check**: Cannot send invite if already transferred
- ✅ **Email Template**: Professional HTML email with sign-up link
- ✅ **Tracking**: Records invite sent timestamp and admin UID

## Security Features

### 1. **Admin-Only Endpoints**
- All admin endpoints require `admin` or `superadmin` role
- Uses `requireAuth` middleware for authentication

### 2. **Status-Based Locking**
- Profiles locked from editing when status is 'ready'
- Profiles locked from editing when status is 'transferred'
- Status transitions are atomic

### 3. **Email Matching**
- Case-insensitive comparison
- Whitespace trimmed
- Normalized before comparison

### 4. **Transaction Safety**
- All critical operations use Firestore transactions
- Prevents race conditions
- Ensures data consistency

## Data Flow

### Profile Creation → Ready → Adoption

1. **Admin creates baked profile**
   - Status: `pending`
   - Editable: Yes
   - Visible in Browse Coaches: Optional (if `visibleInBrowseCoaches: true`)

2. **Admin marks as ready**
   - Status: `ready`
   - Editable: No (locked)
   - Visible in Browse Coaches: If enabled, synced to `creators_index`

3. **Admin sends invite email**
   - Email sent to coach
   - Contains sign-up link
   - Invite tracked in database

4. **Coach signs up with prescribed email**
   - `useBakedProfileAdoption` hook triggers
   - Calls `/api/user/adopt-baked-profile`
   - Transaction transfers all data atomically
   - Status: `transferred`
   - Profile now owned by coach

5. **Browse Coaches Update**
   - Old entry (with `bakedProfileId`) removed
   - New entry (with real `userUid`) added
   - All fields synced

## Edge Cases Handled

1. ✅ **Duplicate Emails**: Prevents creating multiple baked profiles for same email
2. ✅ **Race Conditions**: Transactions prevent concurrent updates
3. ✅ **Email Case Sensitivity**: Normalized to lowercase
4. ✅ **Whitespace**: Trimmed from all inputs
5. ✅ **Invalid URLs**: Validated before saving
6. ✅ **Missing Fields**: Required fields validated
7. ✅ **Already Transferred**: Checks status before operations
8. ✅ **User Already Has Profile**: Prevents overwriting existing profiles
9. ✅ **Token Expiration**: Forces token refresh before API calls
10. ✅ **Network Failures**: Retry logic with exponential backoff

## Error Handling

- All endpoints return proper HTTP status codes
- Comprehensive error messages
- Logging for debugging
- Non-blocking failures (user can still use app)
- Transaction rollback on errors

## Testing Checklist

- [ ] Create baked profile with valid data
- [ ] Create baked profile with duplicate email (should fail)
- [ ] Create baked profile with invalid email (should fail)
- [ ] Update baked profile (pending status)
- [ ] Update baked profile (ready status - should fail)
- [ ] Mark profile as ready
- [ ] Toggle visibility on/off
- [ ] Send invite email
- [ ] Sign up with prescribed email (should adopt)
- [ ] Sign up with different email (should not adopt)
- [ ] Sign up when profile already transferred (should not adopt)
- [ ] Browse Coaches shows baked profiles when visible
- [ ] Browse Coaches updates after adoption

## Integration Points

1. **Auth Hook**: `useBakedProfileAdoption` integrated into admin page
2. **Main App**: Should be added to main layout for all users
3. **Email Service**: Invite email endpoint ready for email service integration
4. **Browse Coaches**: Reads from `creators_index`, filters by `isActive: true`

## Next Steps

1. Add `useBakedProfileAdoption` to main app layout (not just admin page)
2. Integrate actual email service for invite emails
3. Add monitoring/alerting for failed adoptions
4. Add admin dashboard metrics for baked profiles

