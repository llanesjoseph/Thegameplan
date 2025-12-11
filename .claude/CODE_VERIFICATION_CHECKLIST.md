# Code Verification Checklist for Claude Code

**Claude MUST verify these items before writing ANY code**

## 🔍 Pre-Code Checklist

Before writing or modifying any code, Claude will verify:

### ✅ Database Collections

- [ ] Using `users` collection for ALL user types (athletes, coaches, admins)
- [ ] NOT using `athletes` collection for primary athlete data
- [ ] Using `creator_profiles` for extended coach data (if needed)
- [ ] Using `content` collection (NOT `lessons` collection)

### ✅ Field Names

- [ ] Using `creatorUid` (NOT `coachId` or `userId`) for content creator
- [ ] Using `coachId` or `assignedCoachId` for athlete-coach relationship
- [ ] Using `role` field to distinguish user types
- [ ] Using `photoURL` for user profile images (primary)
- [ ] Using `profileImageUrl` for creator_profiles images (fallback)

### ✅ User Type Checks

```typescript
// ✅ CORRECT - Check user in users collection
const userRef = doc(db, 'users', uid)
const userDoc = await getDoc(userRef)
if (userDoc.data().role === 'athlete') { ... }

// ❌ WRONG - Checking non-existent athletes collection
const athleteRef = doc(db, 'athletes', uid)
```

### ✅ Athlete-Coach Relationship

```typescript
// ✅ CORRECT - Get athlete's coach from users collection
const athlete = await getDoc(doc(db, 'users', athleteId))
const coachId = athlete.data().coachId || athlete.data().assignedCoachId
const coach = await getDoc(doc(db, 'users', coachId))

// ❌ WRONG - Assuming separate collections
const athlete = await getDoc(doc(db, 'athletes', athleteId))
```

### ✅ Firestore Rules Patterns

```javascript
// ✅ CORRECT - Athlete access check
exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'athlete' &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coachId == coachUid

// ❌ WRONG - Checking athletes collection
exists(/databases/$(database)/documents/athletes/$(request.auth.uid))
```

## 📋 Code Review Template

For every code change, Claude will announce:

```
🔍 VERIFICATION BEFORE CODING:
✅ Collection: users (for athletes and coaches)
✅ Field: coachId (for athlete-coach link)
✅ Pattern: Using data-model-helpers.ts functions
✅ No references to: 'athletes' collection, 'lessons' collection
```

## 🚫 Forbidden Patterns

Claude will NEVER write code containing:

- `collection('athletes')` for user lookups
- `collection('lessons')` (use `collection('content')`)
- `.where('coachId', '==', uid)` in content queries (use `creatorUid`)
- Firestore rules checking `athletes` collection for access
- Assuming athlete data is separate from users collection

## ✅ Required Patterns

Claude MUST use these patterns:

### For User Lookups:
```typescript
import { getUserFromUsersCollection } from '@/lib/data-model-helpers'
const user = await getUserFromUsersCollection(uid)
```

### For Athlete-Coach Relationship:
```typescript
import { getAthleteCoachId } from '@/lib/data-model-helpers'
const coachId = await getAthleteCoachId(athleteUid)
```

### For Content Queries:
```typescript
const contentRef = collection(db, 'content')
const q = query(contentRef, where('creatorUid', '==', coachId))
```

### For Firestore Rules:
```javascript
// Always check users collection for athlete verification
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'athlete'
```

## 🎯 Verification Steps

Before any code output, Claude will:

1. **Check collection names** - Verify using correct collections
2. **Check field names** - Verify using correct field names
3. **Check user type logic** - Verify athletes/coaches both in users
4. **Check helper functions** - Prefer data-model-helpers.ts functions
5. **Check patterns** - Match approved patterns from docs

## 📚 Reference Documents

Claude will reference these before writing code:

- `DATA_MODEL_QUICK_REFERENCE.md` - Quick patterns
- `docs/DATA_MODEL.md` - Complete reference
- `lib/data-model-helpers.ts` - Helper functions
- `firestore.rules` (lines 1-48) - Critical reference header

## ⚠️ Red Flags

If Claude sees any of these in existing code, flag for fix:

- ⚠️ `doc(db, 'athletes', ...)`
- ⚠️ `collection('lessons')`
- ⚠️ `where('coachId', '==', ...)` in content queries
- ⚠️ Firestore rules with `athletes` collection references
- ⚠️ Comments about "athletes collection" or "lessons collection"

## 🎓 Training Examples

### ❌ WRONG - Before
```typescript
// Getting athlete data
const athleteDoc = await getDoc(doc(db, 'athletes', uid))

// Getting lessons
const lessons = await getDocs(collection(db, 'lessons'))

// Content by coach
query(collection(db, 'content'), where('coachId', '==', uid))
```

### ✅ CORRECT - After
```typescript
// Getting athlete data (they're in users!)
const athleteDoc = await getDoc(doc(db, 'users', uid))
if (athleteDoc.data().role === 'athlete') { ... }

// Getting content (not lessons!)
const content = await getDocs(collection(db, 'content'))

// Content by coach (creatorUid, not coachId!)
query(collection(db, 'content'), where('creatorUid', '==', uid))
```

## 🔄 Every Code Change Process

1. ✅ Read user request
2. ✅ Check if it involves user data, athlete data, or coach data
3. ✅ If yes, verify collection and field names against this checklist
4. ✅ Announce verification status before coding
5. ✅ Write code using approved patterns
6. ✅ Double-check output against checklist
7. ✅ Proceed with confidence

---

**Last Updated:** 2025-10-10
**Purpose:** Prevent data model confusion permanently
**Used By:** Claude Code assistant for all future code changes
