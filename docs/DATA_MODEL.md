# AthLeap Data Model - Critical Reference

## ⚠️ CRITICAL: User Type Architecture

### Core Collections

#### 1. `users` Collection
**THE PRIMARY USER COLLECTION - ALL USERS ARE HERE**

```typescript
interface User {
  uid: string              // Firebase Auth UID
  email: string
  displayName?: string
  photoURL?: string
  role: 'athlete' | 'coach' | 'assistant_coach' | 'admin' | 'superadmin'

  // Athlete-specific fields
  coachId?: string         // Points to coach's UID in users collection
  assignedCoachId?: string // Alternative field for coach assignment

  // Coach-specific fields (optional)
  sport?: string
  yearsExperience?: number

  // Metadata
  createdAt: string
  lastLoginAt?: string
  onboardingComplete?: boolean
}
```

**IMPORTANT RELATIONSHIPS:**
- **Athletes** are in `users` with `role: 'athlete'`
- **Coaches** are in `users` with `role: 'coach'`
- **There is NO separate `athletes` collection!**
- Athlete's `coachId` points to their coach's `uid` in the SAME `users` collection

#### 2. `creator_profiles` Collection
**LEGACY NAME - This is actually COACH PROFILES**

```typescript
interface CreatorProfile {
  uid: string              // Must match user.uid from users collection
  displayName?: string
  bio?: string
  sport?: string
  yearsExperience?: number
  specialties?: string[]
  certifications?: string[]
  achievements?: string[]
  profileImageUrl?: string
  coverImageUrl?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}
```

**IMPORTANT:**
- This is COACH extended profile data
- `uid` matches the coach's `uid` in `users` collection
- NOT used for athletes

#### 3. `coach_profiles` Collection
**NEW COACH PROFILE COLLECTION (if exists)**

Same structure as `creator_profiles` but with modern naming.

### Data Relationships Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USERS Collection                          │
│  (PRIMARY - Contains ALL users)                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Athletes (role: 'athlete')                                  │
│  ├─ uid: "athlete-123"                                       │
│  ├─ email: "athlete@example.com"                             │
│  ├─ role: "athlete"                                          │
│  └─ coachId: "coach-456" ────────────┐                       │
│                                       │                       │
│  Coaches (role: 'coach')              │                       │
│  ├─ uid: "coach-456" <────────────────┘                       │
│  ├─ email: "coach@example.com"                               │
│  ├─ role: "coach"                                             │
│  ├─ photoURL: "https://..."                                  │
│  └─ sport: "Soccer"                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Extended profile data
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              CREATOR_PROFILES Collection                     │
│  (LEGACY NAME - Actually coach extended profiles)            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Coach Profile                                                │
│  ├─ uid: "coach-456"  ← Must match users.uid                 │
│  ├─ bio: "Experienced soccer coach..."                       │
│  ├─ profileImageUrl: "https://..."                           │
│  ├─ specialties: ["Youth Development", "Tactics"]            │
│  └─ certifications: ["UEFA A License"]                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔥 Firestore Security Rules - Critical Patterns

### Checking if User is an Athlete
```javascript
// WRONG - Do NOT check an 'athletes' collection
exists(/databases/$(database)/documents/athletes/$(request.auth.uid))

// CORRECT - Check users collection with role field
exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'athlete'
```

### Checking if Athlete has Access to Coach Data
```javascript
// CORRECT - Check users.coachId or users.assignedCoachId
exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
(get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coachId == coachUid ||
 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedCoachId == coachUid)
```

### Checking if User is a Coach
```javascript
// CORRECT
exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['coach', 'creator', 'assistant_coach']
```

## 💡 Common Mistakes to Avoid

### ❌ WRONG
```typescript
// Looking for athletes in a separate collection
const athleteRef = doc(db, 'athletes', athleteId)

// Assuming coach data is only in creator_profiles
const coachRef = doc(db, 'creator_profiles', coachId)
```

### ✅ CORRECT
```typescript
// Athletes are in users collection
const athleteRef = doc(db, 'users', athleteId)
const athleteDoc = await getDoc(athleteRef)
if (athleteDoc.exists() && athleteDoc.data().role === 'athlete') {
  const coachId = athleteDoc.data().coachId
}

// Coaches are ALSO in users collection (primary data)
const coachRef = doc(db, 'users', coachId)
const coachDoc = await getDoc(coachRef)

// Extended coach profile (optional)
const profileQuery = query(
  collection(db, 'creator_profiles'),
  where('uid', '==', coachId)
)
```

## 🎯 Key Takeaways

1. **ALL users (athletes, coaches, admins) are in the `users` collection**
2. **Athletes have `coachId` field pointing to their coach's UID in `users`**
3. **Coaches have extended profiles in `creator_profiles` (legacy name)**
4. **NEVER check for an `athletes` collection - it doesn't exist!**
5. **Use `role` field to distinguish user types**

## 🔧 Migration Notes

If you see references to:
- `athletes` collection → Should be `users` with role check
- `creator` role → Should be `coach` (legacy terminology)
- Coach lookups without users collection → Add users collection check first

## 📞 Emergency Reference

**When adding athlete access to coach data:**
1. Check user exists in `users` collection
2. Check user has `role: 'athlete'`
3. Check user has `coachId` or `assignedCoachId` matching target coach
4. All checks must use `users` collection, NOT `athletes`
