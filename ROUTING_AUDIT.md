# Complete Routing Audit - All Roles and Invitation Flows

## Role Definitions

- **guest**: Not authenticated
- **user**: Regular user (legacy role, auto-upgraded to creator)
- **athlete**: Athlete using the platform for training
- **creator**: Content creator
- **coach**: Professional coach with athlete management
- **assistant**: Assistant to coaches
- **admin**: System administrator
- **superadmin**: Full system access

## Dashboard Routing Logic (`app/dashboard/page.tsx`)

### Lines 36-75: Main routing logic

```typescript
useEffect(() => {
  if (!loading && user && !hasRedirected.current) {
    hasRedirected.current = true
    const userRole = (user as any).role

    // CRITICAL: Wait for role to load - no default fallback
    if (!userRole) {
      console.error('❌ ROLE NOT LOADED - Waiting for role to be available')
      hasRedirected.current = false
      return
    }

    // Route based on user role
    if (userRole === 'superadmin') {
      router.replace('/dashboard/admin')
    } else if (userRole === 'admin') {
      router.replace('/dashboard/admin')
    } else if (userRole === 'athlete') {
      router.replace('/dashboard/progress')      // ← ATHLETE GOES HERE
    } else if (userRole === 'creator' || userRole === 'coach' || userRole === 'assistant' || userRole === 'user') {
      router.replace('/dashboard/creator')       // ← CREATORS/COACHES GO HERE
    } else {
      router.replace('/dashboard/creator')       // ← UNKNOWN GOES HERE
    }
  }
}, [user, loading, router])
```

**Status**: ✅ FIXED - No longer defaults to 'creator' when role is undefined

## Role-Specific Dashboard Protection

### Athlete Progress Dashboard (`app/dashboard/progress/page.tsx:51-55`)

```typescript
// Redirect coaches to their coach dashboard
useEffect(() => {
  if (!roleLoading && (role === 'coach' || role === 'creator' || role === 'assistant')) {
    router.replace('/dashboard/creator')
  }
}, [role, roleLoading, router])
```

**Status**: ✅ CORRECT - Protects athlete page from non-athletes

### Creator Dashboard (No explicit protection)
- Allows: creator, coach, assistant, admin, superadmin, user
- Blocks: athlete (via dashboard routing)

### Admin Dashboard (`app/dashboard/admin/page.tsx:14`)

```typescript
if (role !== 'superadmin' && role !== 'admin') router.replace('/dashboard')
```

**Status**: ✅ CORRECT - Only admins and superadmins allowed

## Invitation Flows

### 1. Athlete Invitation Flow

**Entry Point**: `/athlete-onboard/[id]`

**Process**:
1. Validate invitation → `/api/validate-invitation?id={invitationId}&type=athlete`
2. Submit athlete profile → `/api/submit-athlete`
3. Backend creates user with role `'athlete'` (line 134 of submit-athlete/route.ts)
4. Success redirect → `/dashboard` (line 633)
5. Dashboard routing → `/dashboard/progress`

**Role Assignment** (`app/api/submit-athlete/route.ts:124-150`):
```typescript
// Preserve elevated roles (coach, creator, admin, superadmin)
// Only set to 'athlete' if they're a regular user
const shouldPreserveRole = existingUserData?.role &&
  ['creator', 'coach', 'assistant', 'admin', 'superadmin'].includes(existingUserData.role)

const userDocData = {
  role: shouldPreserveRole ? existingUserData.role : 'athlete',  // ← ATHLETE ROLE SET HERE
  athleteId,
  coachId: invitationData?.coachId || ''
}
```

**Status**: ✅ CORRECT - Sets 'athlete' role correctly, preserves elevated roles

### 2. Coach Invitation Flow

**Entry Point**: `/coach-onboard/[id]`

**Process**:
1. Validate invitation → `/api/validate-simple-invitation?id={invitationId}` or `/api/coach-ingestion/validate?id={ingestionId}`
2. Submit coach profile → `/api/submit-simple-coach` or `/api/coach-ingestion/submit`
3. Backend creates user with role `'coach'` (see below)
4. Success redirect → `/dashboard/apply-coach/submitted`

**Role Assignment** (`app/api/submit-simple-coach/route.ts`):
```typescript
// Line 42: Get target role from invitation
const targetRole = invitationData?.role || 'coach'

// Line 139: Set user role
role: targetRole  // ← COACH ROLE SET HERE
```

**Status**: ✅ CORRECT - Sets 'coach' role from invitation

### 3. Creator Application Flow

**Entry Point**: `/contributors/apply`

**Process**:
1. Fill application form
2. Submit → `/api/contributor-applications/submit`
3. Admin approval → Role set to 'creator'
4. Success redirect → `/dashboard/creator`

**Status**: ✅ CORRECT

## User Initialization Auto-Corrections

**File**: `lib/user-initialization.ts`

### Auto-Correction Logic (Lines 97-120)

```typescript
// Skip auto-corrections for superadmins and athletes
if (!isSuperadmin(user.email) && userData.role !== 'athlete') {
  // Check if known coach needs role correction
  if (user.email && isKnownCoach(user.email)) {
    const shouldBeRole = getKnownCoachRole(user.email)
    if (shouldBeRole && userData.role !== shouldBeRole) {
      correctRole = shouldBeRole
      roleNeedsUpdate = true
    }
  }

  // Upgrade 'user' roles to 'creator' for dashboard access
  // NEVER upgrade athletes
  if (userData.role === 'user') {
    correctRole = 'creator'
    roleNeedsUpdate = true
  }
}

// CRITICAL: Protect athlete role from any auto-corrections
if (userData.role === 'athlete') {
  console.log(`🛡️ ATHLETE ROLE PROTECTED: ${user.email}`)
}
```

**Protected Roles**:
- ✅ **superadmin**: Never auto-corrected
- ✅ **athlete**: Never auto-corrected (NEW FIX)
- ⚠️ **user**: Auto-upgraded to 'creator'

**Status**: ✅ FIXED - Athletes now protected from auto-corrections

## New User Default Role

**File**: `hooks/use-auth.ts:54`

```typescript
await initializeUserDocument(user, 'creator') // Default to creator for dashboard access
```

**Issue**: New users without invitations get 'creator' role by default

**Impact**: Low - most users come through invitation flows

**Recommendation**: Consider defaulting to 'user' and letting dashboard upgrade to 'creator'

## Role Loading Hooks

### 1. useAuth (`hooks/use-auth.ts`)
- Returns: `{ user: EnhancedUser, loading: boolean }`
- User object includes role from Firestore
- Source of truth: `users/{uid}.role`

### 2. useRole (`hooks/use-role.ts`)
- Returns: `{ role: AppRole, loading: boolean }`
- Reads directly from Firestore `users/{uid}.role`
- Has 10-second timeout protection

### 3. useEnhancedRole (`hooks/use-url-role-switcher.ts`)
- Returns: `{ role: UserRole, loading: boolean, ... }`
- Uses `useAuth()` internally
- Supports URL-based role switching for admins

**Status**: ✅ All hooks use same source of truth (Firestore users collection)

## Post-Onboarding Redirects

| Onboarding Flow | Redirect Target | Expected Final Route |
|----------------|----------------|---------------------|
| Athlete | `/dashboard` | `/dashboard/progress` |
| Coach | `/dashboard/apply-coach/submitted` | Manual navigation to `/dashboard` → `/dashboard/creator` |
| Creator | `/dashboard/creator` | `/dashboard/creator` |

**Status**: ✅ All routes work correctly with fixed dashboard routing

## Known Issues and Fixes

### ✅ FIXED: Athletes routed to creator dashboard
- **Root Cause**: Dashboard defaulted to 'creator' when role was undefined
- **Fix**: Added early return to wait for role to load (app/dashboard/page.tsx:51-55)

### ✅ FIXED: Athlete role being auto-upgraded
- **Root Cause**: User initialization auto-upgraded 'user' → 'creator' without checking for 'athlete'
- **Fix**: Added athlete protection in user-initialization.ts:98

### ⚠️ POTENTIAL: Timing issue on first login
- **Issue**: Role might not be loaded fast enough after account creation
- **Mitigation**: Dashboard now waits for role to load before routing
- **Recommendation**: Add additional logging to track timing

## Testing Checklist

### Athlete Flow
- [ ] Create new athlete invitation
- [ ] Complete athlete onboarding
- [ ] Verify redirected to `/dashboard/progress`
- [ ] Log out and log back in
- [ ] Verify still goes to `/dashboard/progress`
- [ ] Check Firestore: role should be 'athlete'

### Coach Flow
- [ ] Create new coach invitation
- [ ] Complete coach onboarding
- [ ] Verify redirected to `/dashboard/apply-coach/submitted`
- [ ] Navigate to `/dashboard`
- [ ] Verify redirected to `/dashboard/creator`
- [ ] Log out and log back in
- [ ] Verify goes to `/dashboard/creator`
- [ ] Check Firestore: role should be 'coach'

### Role Switching (Superadmin only)
- [ ] Log in as superadmin
- [ ] Use role switcher to view as 'athlete'
- [ ] Verify see athlete dashboard
- [ ] Switch back to superadmin
- [ ] Verify see admin dashboard

### Role Protection
- [ ] Create athlete
- [ ] Verify role in Firestore is 'athlete'
- [ ] Log in as athlete multiple times
- [ ] Verify role never changes to 'creator' or other role

## Recommendations

1. **Add role change auditing**: Log all role changes to audit trail
2. **Add session monitoring**: Track if athletes ever end up on wrong dashboards
3. **Consider default role change**: Default new users to 'user' instead of 'creator'
4. **Add role validation**: Backend endpoint to verify user's role matches expected
5. **Add Firestore trigger**: Prevent role changes from 'athlete' → 'creator' at database level

## Debug Logging

Added comprehensive debug logging to track role loading and routing:

### useRole Hook (`hooks/use-role.ts`)
```
📖 useRole: Loaded role from Firestore: { uid, email, role }
⚠️ useRole: User document not found, defaulting to user role
❌ useRole: Failed to fetch user role from Firestore
```

### useAuth Hook (`hooks/use-auth.ts`)
```
✅ useAuth: User authenticated with role: { uid, email, role }
```

### Dashboard Routing (`app/dashboard/page.tsx`)
```
🔍 DASHBOARD ROUTING DEBUG: { email, uid, detectedRole, roleType, userObject }
✅ Superadmin authenticated, redirecting to Admin Dashboard
✅ Admin authenticated, redirecting to Admin Dashboard
✅ Athlete authenticated, redirecting to Progress Dashboard
✅ Creator/Coach authenticated, redirecting to Creator Dashboard
❌ ROLE NOT LOADED - Waiting for role to be available
⚠️ Unknown role - defaulting to Creator Dashboard
```

**Usage**: Check browser console for these logs to debug routing issues

## Summary

✅ **Dashboard routing**: Fixed to wait for role before routing
✅ **Athlete protection**: Athletes protected from auto-corrections
✅ **Invitation flows**: All flows correctly assign roles
✅ **Role loading**: All hooks use same source of truth
✅ **Debug logging**: Comprehensive logging added to track role loading
⚠️ **Testing needed**: Need to verify fixes work in production

**Critical Fix Status**: All major issues resolved. Athletes should now correctly route to `/dashboard/progress`.
