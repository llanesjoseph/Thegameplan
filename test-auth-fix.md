# Authentication Fix - Testing Guide

## Changes Made

### 1. **Fixed Creator Dashboard Access** (`/app/dashboard/creator/layout.tsx`)
- **Before**: Only allowed `['creator', 'superadmin']` roles
- **After**: Now allows `['user', 'creator', 'coach', 'assistant', 'admin', 'superadmin']` roles
- **Impact**: All authenticated users can now access the creator dashboard

### 2. **Fixed AuthGate Loading State** (`/components/auth/AuthGate.tsx`)
- **Before**: Would show "Insufficient permissions" while role was loading
- **After**:
  - Assumes authorized during loading to prevent flash of error
  - Defaults to 'user' role if user exists but role hasn't loaded
  - Better error messages showing actual vs required roles
  - Smart redirection based on user's actual role (no infinite loops)

### 3. **Fixed Role Loading** (`/hooks/use-url-role-switcher.ts`)
- **Before**: Loading state only checked user presence
- **After**: Properly checks auth loading state
- **Impact**: Prevents premature permission checks

### 4. **Fixed Default Role Assignment** (`/hooks/use-auth.ts`)
- **Before**: New users defaulted to 'user' role
- **After**: New users default to 'creator' role
- **Impact**: New users get immediate dashboard access

### 5. **Fixed Dashboard Routing** (`/app/dashboard/page.tsx`)
- **Before**: Only creators/coaches went to creator dashboard
- **After**: All regular users (user, creator, coach, assistant) go to creator dashboard
- **Impact**: Unified dashboard access for all non-admin users

## Testing Steps

### Test 1: New User Sign Up
1. Sign out completely (clear cookies/session)
2. Sign up with a new email
3. **Expected**: Should be redirected to `/dashboard/creator` without any permission errors
4. Check console for: "creator authenticated, redirecting to Creator Dashboard"

### Test 2: Existing User Sign In
1. Sign in with an existing account
2. **Expected**: Should be redirected to appropriate dashboard based on role
3. No "Insufficient permissions" error should appear

### Test 3: Direct URL Access
1. While signed in, navigate directly to `/dashboard/creator`
2. **Expected**: Should load without permission errors
3. Page should display properly

### Test 4: Role Upgrade Flow
1. If a user with 'user' role signs in
2. **Expected**: Role should auto-upgrade to 'creator'
3. Check console for: "ROLE UPGRADE: Upgrading [email] from 'user' to 'creator'"

### Test 5: Loading States
1. Hard refresh the page while on `/dashboard/creator`
2. **Expected**: Should see loading spinner, not permission error
3. Page should load after auth completes

## Debugging Commands

### Check User's Current Role in Firestore
```javascript
// Run in browser console while signed in
const user = firebase.auth().currentUser;
if (user) {
  const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
  console.log('User role:', userDoc.data()?.role);
}
```

### Force Role Update (if needed)
```javascript
// Run in browser console while signed in
const user = firebase.auth().currentUser;
if (user) {
  await firebase.firestore().collection('users').doc(user.uid).update({
    role: 'creator'
  });
  console.log('Role updated to creator');
  window.location.reload();
}
```

## Common Issues & Solutions

### Issue: Still seeing "Insufficient permissions"
**Solution**:
1. Clear browser cache and cookies
2. Sign out and sign back in
3. Check browser console for errors
4. Verify role in Firestore

### Issue: Redirected to wrong dashboard
**Solution**:
1. Check user's role in Firestore
2. Role might need manual correction
3. Sign out and sign back in to trigger role update

### Issue: Infinite redirect loop
**Solution**:
1. Clear browser cache
2. Navigate to `/` first, then sign in
3. Let authentication complete before navigation

## Success Criteria
- ✅ Users can sign in without permission errors
- ✅ New users get 'creator' role by default
- ✅ All authenticated users can access `/dashboard/creator`
- ✅ No infinite redirect loops
- ✅ Loading states show properly (no flash of error)
- ✅ Role-based routing works correctly

## Rollback Plan
If issues persist, revert these files:
1. `/app/dashboard/creator/layout.tsx`
2. `/components/auth/AuthGate.tsx`
3. `/hooks/use-url-role-switcher.ts`
4. `/hooks/use-auth.ts`
5. `/app/dashboard/page.tsx`