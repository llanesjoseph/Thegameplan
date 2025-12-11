# 🚨 CRITICAL: Data Model Quick Reference

**Keep this file open while coding to prevent data model confusion!**

## ⚡ Quick Facts

```
┌─────────────────────────────────────────────────┐
│  ALL USERS (athletes, coaches, admins)          │
│  are in the 'users' collection                  │
│                                                  │
│  There is NO 'athletes' collection              │
│  for primary athlete data!                      │
└─────────────────────────────────────────────────┘
```

## 🎯 Athlete-Coach Relationship

```typescript
// BOTH in 'users' collection
users/{athleteId}  // role: 'athlete', coachId: 'coach-123'
users/{coachId}    // role: 'coach', (no coachId field)

// Athlete points to coach
athlete.coachId → coach.uid
```

## ❌ WRONG Patterns (DO NOT USE)

```typescript
// ❌ Looking for athletes in separate collection
doc(db, 'athletes', athleteId)

// ❌ Firestore rule checking non-existent collection
exists(/databases/$(database)/documents/athletes/$(uid))

// ❌ Assuming only creator_profiles has coach data
const coachData = await getDoc(doc(db, 'creator_profiles', coachId))
```

## ✅ CORRECT Patterns (ALWAYS USE)

```typescript
// ✅ Get athlete from users collection
const athleteRef = doc(db, 'users', athleteId)
const athleteDoc = await getDoc(athleteRef)
if (athleteDoc.data().role === 'athlete') {
  const coachId = athleteDoc.data().coachId
}

// ✅ Get coach from users collection (primary data)
const coachRef = doc(db, 'users', coachId)
const coachDoc = await getDoc(coachRef)

// ✅ Firestore rule for athlete access
exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'athlete' &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coachId == coachUid
```

## 🔧 Use Helper Functions

```typescript
import {
  getUserFromUsersCollection,
  getAthleteCoachId,
  getCoachFullProfile,
  isAthlete,
  isCoach
} from '@/lib/data-model-helpers'

// Get any user (athlete, coach, admin)
const user = await getUserFromUsersCollection(uid)

// Check user type
if (isAthlete(user)) {
  const coachId = await getAthleteCoachId(uid)
}

// Get coach data (combines users + creator_profiles)
const coach = await getCoachFullProfile(coachId)
```

## 📚 Full Documentation

- `/docs/DATA_MODEL.md` - Complete data model reference
- `/lib/data-model-helpers.ts` - Type-safe helper functions
- `/firestore.rules` - Security rules with detailed comments

## ⚠️ Before Editing Firestore Rules

1. Read the header in `firestore.rules` (lines 1-48)
2. NEVER reference `athletes` collection for access checks
3. ALWAYS check `users` collection with role field
4. Test with athlete accounts to verify access works

## 🆘 Emergency Checklist

If permission errors occur:

- [ ] Is the check looking at `users` collection?
- [ ] Does the rule check the `role` field?
- [ ] For athletes: Does it check `coachId` or `assignedCoachId`?
- [ ] Are you checking the right UID (athlete vs coach)?
- [ ] Did you deploy the rules? (`firebase deploy --only firestore:rules`)
