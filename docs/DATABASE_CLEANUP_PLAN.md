# Database Cleanup & Role Simplification Plan

## Current State Analysis

### Existing Roles
Currently, the system has **8 different role values**:
1. `guest` - Not signed in
2. `user` - Legacy athlete role
3. `athlete` - Proper athlete role
4. `creator` - Legacy coach role
5. `coach` - Proper coach role
6. `assistant` - Assistant coach role
7. `admin` - Administrator role
8. `superadmin` - Super administrator role

### Problems
- ❌ Role overlap: `user` vs `athlete`, `creator` vs `coach`
- ❌ Inconsistent routing based on role
- ❌ Data scattered across multiple collections
- ❌ No clear data hierarchy

---

## Target State

### Simplified 5-Role System
1. **athlete** - Athletes using the platform
2. **coach** - Coaches creating content and training athletes
3. **assistant** - Assistant coaches helping with coaching
4. **admin** - Platform administrators
5. **superadmin** - Super administrators (only joseph@crucibleanalytics.dev)

### Role Migration Mapping
```
guest      → DELETE (redirect to sign-in)
user       → athlete
creator    → coach
coach      → coach (keep as-is)
athlete    → athlete (keep as-is)
assistant  → assistant (keep as-is)
admin      → admin (keep as-is)
superadmin → superadmin (keep as-is)
```

---

## New Database Schema

### Athlete-Centric Data Model

All data cascades from the **athlete** as the primary entity.

```
athletes/ (collection)
  {athleteId}/ (document)
    - uid: string (Firebase Auth UID)
    - email: string
    - displayName: string
    - role: "athlete"
    - photoURL?: string
    - sport: string
    - age?: number
    - skillLevel: "beginner" | "intermediate" | "advanced"
    - onboardingComplete: boolean
    - coachId?: string (reference to coach)
    - createdAt: timestamp
    - updatedAt: timestamp

    athleteProgress/ (subcollection)
      {progressId}/ (document)
        - completedSessions: number
        - totalHours: number
        - currentStreak: number
        - achievements: array
        - lastActivityAt: timestamp

    athleteNotifications/ (subcollection)
      {notificationId}/ (document)
        - type: "session" | "achievement" | "message"
        - title: string
        - message: string
        - read: boolean
        - createdAt: timestamp

    athleteSessions/ (subcollection)
      {sessionId}/ (document)
        - coachId: string
        - scheduledAt: timestamp
        - status: "proposed" | "confirmed" | "completed" | "cancelled"
        - notes?: string
        - completedAt?: timestamp

    athleteGoals/ (subcollection)
      {goalId}/ (document)
        - title: string
        - description: string
        - targetDate?: timestamp
        - status: "active" | "completed" | "abandoned"
        - progress: number (0-100)
        - createdAt: timestamp

coaches/ (collection)
  {coachId}/ (document)
    - uid: string (Firebase Auth UID)
    - email: string
    - displayName: string
    - role: "coach"
    - photoURL?: string
    - sport: string
    - bio: string
    - certifications: array
    - specialties: array
    - verified: boolean
    - status: "pending" | "approved" | "suspended"
    - onboardingComplete: boolean
    - createdAt: timestamp
    - updatedAt: timestamp

    coachAthletes/ (subcollection)
      {athleteId}/ (document)
        - athleteId: string (reference)
        - displayName: string
        - sport: string
        - status: "active" | "inactive"
        - startedAt: timestamp

    coachContent/ (subcollection)
      {contentId}/ (document)
        - title: string
        - type: "video" | "lesson" | "program"
        - videoUrl?: string
        - published: boolean
        - createdAt: timestamp

assistants/ (collection)
  {assistantId}/ (document)
    - uid: string
    - email: string
    - displayName: string
    - role: "assistant"
    - coachId: string (coach they assist)
    - permissions: array
    - createdAt: timestamp

admins/ (collection)
  {adminId}/ (document)
    - uid: string
    - email: string
    - displayName: string
    - role: "admin" | "superadmin"
    - permissions: array
    - createdAt: timestamp

users/ (collection) - MASTER COLLECTION
  {userId}/ (document)
    - uid: string (same as document ID)
    - email: string
    - displayName: string
    - role: "athlete" | "coach" | "assistant" | "admin" | "superadmin"
    - photoURL?: string
    - onboardingComplete: boolean
    - createdAt: timestamp
    - updatedAt: timestamp
    - lastLoginAt: timestamp
```

---

## Migration Steps

### Phase 1: Set Super Admin
```javascript
// Set joseph@crucibleanalytics.dev as the ONLY superadmin
users/{josephUserId}
  role: "superadmin"
```

### Phase 2: Migrate User Roles
```javascript
// For each user document:
1. Read current role
2. Map to new role:
   - user → athlete
   - creator → coach
3. Update users/{userId}.role
4. Create corresponding athlete/ or coach/ document
5. Move data to appropriate subcollections
```

### Phase 3: Clean Up Collections
```
DELETE or MIGRATE:
- contributor_profiles/ → move to coaches/
- creator_profiles/ → move to coaches/
- creator_index/ → rebuild as coach_index/
- creatorAnalytics/ → move to coaches/{id}/analytics/
- creatorPublic/ → rebuild from coaches/
```

### Phase 4: Update Security Rules
Update Firestore rules to only recognize 5 roles.

### Phase 5: Update Code References
Update all role checks in code to use new 5-role system.

---

## Data Preservation Checklist

### Must Preserve
- ✅ All athlete progress data
- ✅ All coach content (videos, lessons)
- ✅ All session history
- ✅ All notifications
- ✅ All user achievements
- ✅ All profile information

### Can Archive
- Old role application data
- Deprecated fields
- Unused collections

### Can Delete
- Duplicate data
- Test data
- Invalid users with no activity

---

## Rollback Plan

1. Before migration, export full database backup
2. Tag backup with timestamp: `backup-{YYYY-MM-DD-HH-mm}`
3. If migration fails, restore from backup
4. Test migration on staging environment first

---

## Success Criteria

✅ All users have one of 5 roles: athlete, coach, assistant, admin, superadmin
✅ joseph@crucibleanalytics.dev is the only superadmin
✅ All athlete data cascades from athletes/ collection
✅ All coach data cascades from coaches/ collection
✅ No data loss - all important information preserved
✅ All routes work correctly for all 5 roles
✅ Security rules enforce 5-role system
✅ No more role confusion or overlaps

---

## Next Steps

1. Review this plan
2. Create database backup
3. Run migration script (provided separately)
4. Test each role's dashboard access
5. Verify data integrity
6. Update Firestore security rules
7. Deploy code changes
