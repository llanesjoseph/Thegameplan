# ✅ Correct Code Patterns - Copy & Paste Reference

**Use these approved patterns - they're guaranteed to work correctly**

## 🎯 Users Collection (ALL Users Live Here)

### Get ANY user (athlete, coach, admin):
```typescript
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

const userRef = doc(db, 'users', userId)
const userDoc = await getDoc(userRef)

if (userDoc.exists()) {
  const userData = userDoc.data()
  const role = userData.role // 'athlete' | 'coach' | 'admin' | etc.

  if (role === 'athlete') {
    const coachId = userData.coachId || userData.assignedCoachId
    // This athlete's coach is in users collection at coachId
  }
}
```

### Check if user is an athlete:
```typescript
const user = await getDoc(doc(db, 'users', userId))
if (user.exists() && user.data().role === 'athlete') {
  console.log('This is an athlete')
}
```

### Check if user is a coach:
```typescript
const user = await getDoc(doc(db, 'users', userId))
const isCoach = user.exists() &&
  ['coach', 'creator', 'assistant_coach'].includes(user.data().role)
```

## 🔗 Athlete → Coach Relationship

### Get athlete's coach:
```typescript
// Step 1: Get athlete from users collection
const athleteDoc = await getDoc(doc(db, 'users', athleteId))
if (!athleteDoc.exists() || athleteDoc.data().role !== 'athlete') {
  throw new Error('Not an athlete')
}

// Step 2: Get coachId from athlete document
const coachId = athleteDoc.data().coachId || athleteDoc.data().assignedCoachId
if (!coachId) {
  throw new Error('No coach assigned')
}

// Step 3: Get coach from SAME users collection
const coachDoc = await getDoc(doc(db, 'users', coachId))
const coachData = coachDoc.data()
```

### Using Helper Function (Preferred):
```typescript
import { getAthleteCoachId, getUserFromUsersCollection } from '@/lib/data-model-helpers'

// Get athlete's coach ID
const coachId = await getAthleteCoachId(athleteId)

// Get coach user data
const coach = await getUserFromUsersCollection(coachId)
```

## 👤 Coach Profile Data

### Get complete coach profile:
```typescript
import { getCoachFullProfile } from '@/lib/data-model-helpers'

const profile = await getCoachFullProfile(coachId)
if (profile) {
  const { user, profile: extendedProfile } = profile

  // Primary data from users collection
  const displayName = user.displayName
  const email = user.email
  const photoURL = user.photoURL
  const sport = user.sport

  // Extended data from creator_profiles (if exists)
  const bio = extendedProfile?.bio || ''
  const profileImageUrl = extendedProfile?.profileImageUrl || ''
  const certifications = extendedProfile?.certifications || []

  // Priority for profile image: users.photoURL > creator_profiles.profileImageUrl
  const finalPhotoURL = user.photoURL || extendedProfile?.profileImageUrl || ''
}
```

### Manual coach profile fetch:
```typescript
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

// Step 1: Get coach from users collection (PRIMARY)
const coachDoc = await getDoc(doc(db, 'users', coachId))
const coachData = coachDoc.data()

// Step 2: Get extended profile from creator_profiles (OPTIONAL)
const profileQuery = query(
  collection(db, 'creator_profiles'),
  where('uid', '==', coachId)
)
const profileSnap = await getDocs(profileQuery)
const profileData = profileSnap.empty ? null : profileSnap.docs[0].data()

// Step 3: Combine data
const fullProfile = {
  ...coachData,
  ...profileData,
  // Priority: users.photoURL first, then profileImageUrl
  photoURL: coachData.photoURL || profileData?.profileImageUrl || ''
}
```

## 📚 Content Collection (NOT Lessons!)

### Query content by creator:
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore'

const contentRef = collection(db, 'content')
const q = query(
  contentRef,
  where('creatorUid', '==', coachId),  // ✅ creatorUid NOT coachId
  where('status', '==', 'published')
)
const snapshot = await getDocs(q)
```

### Get athlete's coach content:
```typescript
// Step 1: Get athlete's coach ID
const athleteDoc = await getDoc(doc(db, 'users', athleteId))
const coachId = athleteDoc.data().coachId

// Step 2: Query content by coach (as creator)
const contentQuery = query(
  collection(db, 'content'),
  where('creatorUid', '==', coachId),
  where('status', '==', 'published')
)
const lessons = await getDocs(contentQuery)
```

## 🔒 Firestore Rules - Athlete Access Patterns

### Allow athlete to read their coach's user document:
```javascript
match /users/{userId} {
  allow read: if isAuthenticated() &&
                 exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                 (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coachId == userId ||
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedCoachId == userId);
}
```

### Allow athlete to read coach's content:
```javascript
match /content/{contentId} {
  allow get: if isAuthenticated() &&
                exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coachId == resource.data.creatorUid ||
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedCoachId == resource.data.creatorUid) &&
                (resource.data.visibility == 'public' || resource.data.visibility == 'athletes_only');
}
```

### Allow athlete to read coach's profile:
```javascript
match /coach_profiles/{userId} {
  allow read: if isAuthenticated() &&
                 exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                 (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coachId == userId ||
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedCoachId == userId);
}
```

## 🎨 React Components

### Display coach profile with photo:
```typescript
'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export default function CoachProfile({ coachId }: { coachId: string }) {
  const [coach, setCoach] = useState<any>(null)
  const [photoURL, setPhotoURL] = useState<string>('')

  useEffect(() => {
    async function loadCoach() {
      // Get from users collection
      const coachDoc = await getDoc(doc(db, 'users', coachId))
      if (coachDoc.exists()) {
        const data = coachDoc.data()
        setCoach(data)
        setPhotoURL(data.photoURL || '')
      }
    }
    loadCoach()
  }, [coachId])

  return (
    <div>
      {photoURL ? (
        <img src={photoURL} alt={coach?.displayName} />
      ) : (
        <div>{coach?.displayName?.charAt(0)}</div>
      )}
      <h2>{coach?.displayName}</h2>
      <p>{coach?.sport}</p>
    </div>
  )
}
```

## 📊 API Routes

### Get user by ID:
```typescript
// app/api/user/[id]/route.ts
import { adminDb } from '@/lib/firebase.admin'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id

  // Get from users collection
  const userDoc = await adminDb.collection('users').doc(userId).get()

  if (!userDoc.exists) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userData = userDoc.data()

  // Check if athlete and get coach if needed
  if (userData.role === 'athlete' && userData.coachId) {
    const coachDoc = await adminDb.collection('users').doc(userData.coachId).get()
    const coachData = coachDoc.data()

    return NextResponse.json({
      user: userData,
      coach: coachData
    })
  }

  return NextResponse.json({ user: userData })
}
```

## 🔍 Quick Reference Table

| Need to... | Collection | Field | Pattern |
|-----------|-----------|-------|---------|
| Get athlete data | `users` | `role: 'athlete'` | `doc(db, 'users', athleteId)` |
| Get coach data | `users` | `role: 'coach'` | `doc(db, 'users', coachId)` |
| Link athlete → coach | `users` | `coachId` or `assignedCoachId` | athlete.coachId = coach.uid |
| Get content by coach | `content` | `creatorUid` | `where('creatorUid', '==', coachId)` |
| Get coach photo | `users` → `creator_profiles` | `photoURL` → `profileImageUrl` | Priority: users first |
| Extended coach profile | `creator_profiles` | `uid` matches users | Optional extra data |

## 🚫 NEVER Use These Patterns

```typescript
// ❌ WRONG - No athletes collection for primary data
doc(db, 'athletes', athleteId)

// ❌ WRONG - No lessons collection
collection(db, 'lessons')

// ❌ WRONG - Content uses creatorUid not coachId
where('coachId', '==', uid)

// ❌ WRONG - Firestore rule checking athletes collection
exists(/databases/$(database)/documents/athletes/$(uid))
```

---

**Keep this file open while coding for quick copy-paste reference!**
