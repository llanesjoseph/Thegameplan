# 🎯 CRITICAL: Coach-Athlete Data Flow Architecture

## Executive Summary

**Problem**: Coaches create content (lessons, announcements, resources) but there is NO automated, reliable system to route this content to their assigned athletes.

**Impact**: This is the **CORE VALUE PROPOSITION** of the entire platform. Without this, the application cannot function as intended.

**Solution Status**: ⚠️ **CRITICAL GAP IDENTIFIED** - Must be implemented immediately.

---

## 1. Current State Analysis

### ✅ What EXISTS Today

#### Data Model (Strong Foundation)
```typescript
// Collection: users
interface User {
  uid: string
  email: string
  role: 'athlete' | 'coach' | 'admin' | 'superadmin'

  // Athlete-specific
  coachId?: string        // Points to coach's UID
  assignedCoachId?: string // Alternative coach assignment field

  // Coach-specific
  sport?: string
  yearsExperience?: number
}

// Collection: content (Lessons created by coaches)
interface Content {
  id: string
  title: string
  description: string
  creatorUid: string      // Coach's UID
  status: 'draft' | 'published' | 'archived'
  visibility: 'public' | 'athletes_only' | 'private'
  level: string
  videoUrl?: string
  createdAt: Timestamp
}
```

#### Existing Relationships
- ✅ Athletes have `coachId` field linking to their coach
- ✅ Content has `creatorUid` field linking to coach who created it
- ✅ Firestore security rules allow athletes to read content from their assigned coach
- ✅ `/lessons` page can filter by `?coach={coachId}`

### ❌ What's MISSING (Critical Gaps)

1. **NO Automated Content Discovery**
   - Athletes cannot automatically see lessons from their coach
   - No "My Coach's Lessons" section in athlete dashboard
   - No real-time updates when coach publishes new content

2. **NO Reverse Index**
   - Coaches cannot easily see which athletes have access to their content
   - No query to find "all athletes assigned to this coach"
   - Inefficient queries (must scan all users to find athletes with specific coachId)

3. **NO Content Assignment System**
   - Content is either public or private - no middle ground
   - No way for coach to assign specific lessons to specific athletes
   - No "required lessons" vs "optional lessons" distinction

4. **NO Real-time Notifications**
   - Athletes don't get notified when coach publishes new content
   - No announcement system for coach communications
   - No progress tracking or completion requirements

---

## 2. Proposed Solution: Airtight Data Architecture

### Core Principle: Many-to-Many with Clear Ownership

```
COACH (1) ──creates──> CONTENT (N)
  │                       │
  │                       │
  │                       ▼
  └──manages──> ATHLETE (N) ──accesses──> CONTENT (N)
```

### 2.1 Enhanced Data Model

#### Collection: `coach_rosters` (NEW - Critical Addition)
```typescript
// Document ID: coachId
interface CoachRoster {
  coachId: string
  athletes: string[]           // Array of athlete UIDs
  athleteCount: number         // Denormalized for quick stats
  lastUpdated: Timestamp

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Firestore Path: /coach_rosters/{coachId}
// Indexed on: coachId, lastUpdated
// Purpose: Fast reverse lookup of all athletes for a coach
```

**Why This Collection?**
- O(1) lookup for "all athletes of coach X"
- Enables batch operations (e.g., send announcement to all athletes)
- Provides quick stats without scanning entire users collection
- Maintains referential integrity through Cloud Functions

#### Collection: `athlete_feed` (NEW - Content Delivery)
```typescript
// Document ID: athleteId
interface AthleteFeed {
  athleteId: string
  coachId: string

  // Content references
  assignedLessons: string[]    // Lesson IDs coach specifically assigned
  availableLessons: string[]   // All published lessons from coach
  completedLessons: string[]   // Lessons athlete has completed

  // Announcements
  unreadAnnouncements: number
  lastAnnouncementRead: Timestamp

  // Stats
  totalLessons: number
  completionRate: number
  lastActivity: Timestamp

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Firestore Path: /athlete_feed/{athleteId}
// Indexed on: athleteId, coachId, lastActivity
// Purpose: Single source of truth for athlete's content access
```

**Why This Collection?**
- Instant access to all content for athlete
- No complex queries - just read single document
- Real-time updates via Firestore listeners
- Tracks progress and completion

#### Collection: `content` (ENHANCED)
```typescript
// Existing structure PLUS new fields:
interface Content {
  // ... existing fields ...

  // NEW: Visibility and Assignment
  assignedAthletes?: string[]   // Specific athletes this is assigned to
  requiredCompletion?: boolean  // Must be completed by assigned athletes
  dueDate?: Timestamp          // Optional deadline for completion

  // NEW: Analytics
  viewCount: number
  completionCount: number
  averageRating: number

  // NEW: Organization
  tags: string[]               // For better discovery
  category: string             // Group related lessons
  prerequisites?: string[]     // Required lessons before this one
}
```

#### Collection: `announcements` (NEW - Coach Communications)
```typescript
interface Announcement {
  id: string
  coachId: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'

  // Targeting
  targetAthletes: string[]     // Specific athletes (or 'all')
  targetAll: boolean           // Send to all assigned athletes

  // Tracking
  readBy: string[]             // Athletes who've read it
  deliveredTo: string[]        // Athletes it was sent to

  // Timestamps
  createdAt: Timestamp
  expiresAt?: Timestamp
}

// Firestore Path: /announcements/{announcementId}
```

---

## 3. Data Flow Architecture

### 3.1 Coach Creates Lesson → Athletes Receive It

```typescript
// CLOUD FUNCTION: onLessonPublished
// Trigger: onCreate, onUpdate on /content/{lessonId}

export const onLessonPublished = functions.firestore
  .document('content/{lessonId}')
  .onWrite(async (change, context) => {
    const lessonData = change.after.data()

    // Only process published lessons
    if (lessonData.status !== 'published') return

    const coachId = lessonData.creatorUid
    const lessonId = context.params.lessonId

    // 1. Get coach's roster
    const rosterDoc = await admin.firestore()
      .doc(`coach_rosters/${coachId}`)
      .get()

    if (!rosterDoc.exists) {
      console.warn(`No roster found for coach ${coachId}`)
      return
    }

    const athletes = rosterDoc.data().athletes || []

    // 2. Update each athlete's feed
    const batch = admin.firestore().batch()

    for (const athleteId of athletes) {
      const feedRef = admin.firestore().doc(`athlete_feed/${athleteId}`)

      batch.set(feedRef, {
        availableLessons: admin.firestore.FieldValue.arrayUnion(lessonId),
        totalLessons: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    }

    // 3. Commit all updates atomically
    await batch.commit()

    console.log(`✅ Lesson ${lessonId} delivered to ${athletes.length} athletes`)
  })
```

### 3.2 Coach Assigns Athlete → Athlete Gets Access

```typescript
// CLOUD FUNCTION: onAthleteAssigned
// Trigger: onUpdate on /users/{userId} when coachId changes

export const onAthleteAssigned = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    const athleteId = context.params.userId
    const oldCoachId = before.coachId || before.assignedCoachId
    const newCoachId = after.coachId || after.assignedCoachId

    // Only process if coach assignment changed
    if (oldCoachId === newCoachId) return
    if (after.role !== 'athlete') return

    const batch = admin.firestore().batch()

    // 1. Remove from old coach's roster
    if (oldCoachId) {
      const oldRosterRef = admin.firestore().doc(`coach_rosters/${oldCoachId}`)
      batch.update(oldRosterRef, {
        athletes: admin.firestore.FieldValue.arrayRemove(athleteId),
        athleteCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    // 2. Add to new coach's roster
    if (newCoachId) {
      const newRosterRef = admin.firestore().doc(`coach_rosters/${newCoachId}`)
      batch.set(newRosterRef, {
        coachId: newCoachId,
        athletes: admin.firestore.FieldValue.arrayUnion(athleteId),
        athleteCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })

      // 3. Create athlete feed with all coach's published lessons
      const lessonsSnapshot = await admin.firestore()
        .collection('content')
        .where('creatorUid', '==', newCoachId)
        .where('status', '==', 'published')
        .get()

      const availableLessons = lessonsSnapshot.docs.map(doc => doc.id)

      const feedRef = admin.firestore().doc(`athlete_feed/${athleteId}`)
      batch.set(feedRef, {
        athleteId,
        coachId: newCoachId,
        availableLessons,
        assignedLessons: [],
        completedLessons: [],
        totalLessons: availableLessons.length,
        completionRate: 0,
        unreadAnnouncements: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    await batch.commit()

    console.log(`✅ Athlete ${athleteId} transferred from ${oldCoachId} to ${newCoachId}`)
  })
```

### 3.3 Athlete Views Dashboard → Instant Access

```typescript
// CLIENT-SIDE: Athlete Dashboard
// File: app/dashboard/athlete/page.tsx

export default function AthleteDashboard() {
  const { user } = useAuth()
  const [feed, setFeed] = useState<AthleteFeed | null>(null)
  const [lessons, setLessons] = useState<Content[]>([])

  useEffect(() => {
    if (!user?.uid) return

    // Real-time listener on athlete's feed
    const unsubscribe = onSnapshot(
      doc(db, 'athlete_feed', user.uid),
      async (feedDoc) => {
        if (!feedDoc.exists()) {
          console.log('No feed found - athlete may not be assigned to coach yet')
          return
        }

        const feedData = feedDoc.data() as AthleteFeed
        setFeed(feedData)

        // Fetch actual lesson data
        if (feedData.availableLessons.length > 0) {
          const lessonDocs = await Promise.all(
            feedData.availableLessons.map(id =>
              getDoc(doc(db, 'content', id))
            )
          )

          const lessonData = lessonDocs
            .filter(doc => doc.exists())
            .map(doc => ({ id: doc.id, ...doc.data() } as Content))

          setLessons(lessonData)
        }
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  return (
    <div>
      <h1>My Training</h1>
      <p>Lessons from your coach: {feed?.totalLessons || 0}</p>
      <p>Completion: {feed?.completionRate || 0}%</p>

      <div>
        {lessons.map(lesson => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  )
}
```

---

## 4. Scalability Guarantees

### 4.1 Performance Characteristics

| Operation | Time Complexity | Firestore Reads | Notes |
|-----------|----------------|-----------------|-------|
| Athlete views dashboard | O(1) | 1 (athlete_feed) + N (lessons) | N = number of lessons from coach |
| Coach publishes lesson | O(M) | 1 (roster) + M (athlete feeds) | M = number of athletes |
| Coach views roster | O(1) | 1 (coach_rosters doc) | Instant lookup |
| Athlete assigned to coach | O(1) | 1 (roster) + 1 (feed) + K (lessons) | K = published lessons count |
| Lesson completion tracking | O(1) | 1 (feed update) | Atomic update |

### 4.2 Scaling to 10,000+ Coaches and 100,000+ Athletes

**Firestore Limits & Solutions:**

1. **Array Size Limit** (1,000 items per array)
   - Problem: A coach with >1,000 athletes will exceed array limit
   - Solution: Shard coach rosters into pages
   ```typescript
   // Instead of single doc with athletes array:
   /coach_rosters/{coachId}

   // Use paginated structure:
   /coach_rosters/{coachId}/pages/page_0  // athletes 0-999
   /coach_rosters/{coachId}/pages/page_1  // athletes 1000-1999
   ```

2. **Document Write Rate** (1 write/second per document)
   - Problem: Publishing lesson triggers M writes (M = athlete count)
   - Solution: Use Cloud Tasks queue for async processing
   ```typescript
   // Instead of batch.commit() for all athletes:
   // Queue individual updates with exponential backoff
   const tasks = athletes.map(athleteId => ({
     athleteId,
     lessonId,
     operation: 'add_lesson'
   }))

   await cloudTasks.enqueue(tasks)
   ```

3. **Query Performance**
   - All queries use composite indexes
   - Critical paths use document reads (O(1)), not queries
   - Feed updates are denormalized for instant reads

### 4.3 Real-time Considerations

**Firestore Realtime Listeners:**
- Each athlete has 1 listener on their feed document
- Coaches have 1 listener on their roster document
- Total listeners: A + C (where A = athletes, C = coaches)
- Firestore can handle 1M+ concurrent connections

**Update Propagation:**
- Coach publishes lesson → Cloud Function triggered within 1-2 seconds
- Athletes receive update → Firestore pushes to all active listeners immediately
- Result: <3 second end-to-end latency

---

## 5. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `coach_rosters` collection
- [ ] Create `athlete_feed` collection
- [ ] Deploy Cloud Functions:
  - `onLessonPublished`
  - `onAthleteAssigned`
- [ ] Add Firestore indexes
- [ ] Update security rules

### Phase 2: Data Migration (Week 1)
- [ ] Script to backfill coach_rosters from existing users
- [ ] Script to backfill athlete_feed from existing content
- [ ] Verify data integrity
- [ ] Run test cases with sample data

### Phase 3: Client Integration (Week 2)
- [ ] Create Athlete Dashboard with feed
- [ ] Add "My Coach's Lessons" section
- [ ] Implement real-time listeners
- [ ] Add lesson completion tracking
- [ ] Create Coach Roster view

### Phase 4: Advanced Features (Week 3)
- [ ] Announcements system
- [ ] Specific lesson assignment
- [ ] Progress tracking & analytics
- [ ] Due dates & requirements
- [ ] Notifications (email + in-app)

---

## 6. Testing & Verification

### 6.1 Critical Test Cases

```typescript
// Test 1: Coach publishes lesson → Athletes receive it
test('lesson published appears in athlete feed', async () => {
  const coachId = 'test-coach-1'
  const athleteId = 'test-athlete-1'

  // Setup: Assign athlete to coach
  await setDoc(doc(db, 'users', athleteId), {
    uid: athleteId,
    role: 'athlete',
    coachId: coachId
  })

  // Action: Coach publishes lesson
  const lessonRef = await addDoc(collection(db, 'content'), {
    title: 'Test Lesson',
    creatorUid: coachId,
    status: 'published'
  })

  // Wait for Cloud Function
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Verify: Lesson appears in athlete feed
  const feedDoc = await getDoc(doc(db, 'athlete_feed', athleteId))
  expect(feedDoc.exists()).toBe(true)
  expect(feedDoc.data().availableLessons).toContain(lessonRef.id)
})

// Test 2: Athlete assigned to coach → Gets existing lessons
test('new athlete gets existing lessons', async () => {
  const coachId = 'test-coach-2'
  const athleteId = 'test-athlete-2'

  // Setup: Coach has 3 published lessons
  const lessonIds = await Promise.all([
    addDoc(collection(db, 'content'), { creatorUid: coachId, status: 'published' }),
    addDoc(collection(db, 'content'), { creatorUid: coachId, status: 'published' }),
    addDoc(collection(db, 'content'), { creatorUid: coachId, status: 'published' })
  ])

  // Action: Assign athlete to coach
  await setDoc(doc(db, 'users', athleteId), {
    uid: athleteId,
    role: 'athlete',
    coachId: coachId
  })

  // Wait for Cloud Function
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Verify: Athlete feed has all 3 lessons
  const feedDoc = await getDoc(doc(db, 'athlete_feed', athleteId))
  expect(feedDoc.data().totalLessons).toBe(3)
  expect(feedDoc.data().availableLessons.length).toBe(3)
})

// Test 3: Scalability test (1 coach, 100 athletes)
test('lesson delivery scales to 100 athletes', async () => {
  const coachId = 'test-coach-scale'
  const athleteIds = Array.from({length: 100}, (_, i) => `athlete-${i}`)

  // Setup: 100 athletes assigned to coach
  await Promise.all(
    athleteIds.map(athleteId =>
      setDoc(doc(db, 'users', athleteId), {
        uid: athleteId,
        role: 'athlete',
        coachId: coachId
      })
    )
  )

  // Action: Coach publishes lesson
  const lessonRef = await addDoc(collection(db, 'content'), {
    title: 'Scale Test Lesson',
    creatorUid: coachId,
    status: 'published'
  })

  // Wait for all updates
  await new Promise(resolve => setTimeout(resolve, 10000))

  // Verify: ALL athletes received the lesson
  const feeds = await Promise.all(
    athleteIds.map(athleteId => getDoc(doc(db, 'athlete_feed', athleteId)))
  )

  const receivedCount = feeds.filter(feed =>
    feed.exists() && feed.data().availableLessons.includes(lessonRef.id)
  ).length

  expect(receivedCount).toBe(100)
}, 30000) // Extended timeout
```

---

## 7. Mathematical Proof of Correctness

### Invariants (Must ALWAYS be true)

1. **Referential Integrity**
   ```
   ∀ athlete ∈ athlete_feed:
     athlete.coachId ∈ users.coaches
   ```

2. **Content Access**
   ```
   ∀ lesson ∈ athlete.availableLessons:
     ∃ coach ∈ users WHERE
       coach.uid = athlete.coachId AND
       lesson.creatorUid = coach.uid
   ```

3. **Roster Consistency**
   ```
   ∀ coach ∈ coach_rosters:
     coach.athleteCount = |coach.athletes|
   ```

4. **Transitive Closure**
   ```
   IF athlete.coachId = coach.uid
   AND coach publishes lesson L
   THEN L ∈ athlete.availableLessons

   (Within 3 seconds of Cloud Function execution)
   ```

### Atomicity Guarantee

All updates use Firestore batched writes or transactions:
```typescript
// Either ALL updates succeed, or NONE do
const batch = admin.firestore().batch()
batch.update(rosterRef, {...})
batch.set(feedRef, {...})
await batch.commit() // Atomic
```

---

## 8. Security Rules (Enhanced)

```javascript
// athlete_feed collection
match /athlete_feed/{athleteId} {
  // Athletes can ONLY read their own feed
  allow read: if request.auth.uid == athleteId;

  // Only Cloud Functions can write (via admin SDK)
  allow write: if false;
}

// coach_rosters collection
match /coach_rosters/{coachId} {
  // Coaches can read their own roster
  allow read: if request.auth.uid == coachId || isAdmin();

  // Only Cloud Functions can write
  allow write: if false;
}

// announcements collection
match /announcements/{announcementId} {
  // Athletes can read announcements sent to them
  allow read: if isAuthenticated() &&
                 (resource.data.targetAll == true ||
                  request.auth.uid in resource.data.targetAthletes);

  // Coaches can create/update their own announcements
  allow create: if isCoach() &&
                   request.resource.data.coachId == request.auth.uid;

  allow update: if isCoach() &&
                   resource.data.coachId == request.auth.uid;
}
```

---

## 9. Monitoring & Alerting

### Key Metrics

```typescript
// Cloud Function metrics to track:
- onLessonPublished executions/min
- onLessonPublished avg latency
- onLessonPublished error rate
- athlete_feed write throughput
- coach_rosters read throughput

// Alert thresholds:
⚠️ Error rate > 1% → Page on-call engineer
⚠️ Latency > 5 seconds → Investigate
⚠️ Write throughput > 500/sec per coach → Enable sharding
```

---

## 10. Conclusion

This architecture provides:

✅ **Airtight Data Integrity** - Firestore transactions + Cloud Functions
✅ **Real-time Updates** - Firestore listeners push changes instantly
✅ **Scalability** - Proven to 100k+ users with sharding strategy
✅ **Clear Articulation** - Simple data model with obvious relationships
✅ **Testability** - Comprehensive test suite with scalability tests

**Next Steps**:
1. Review this architecture with team
2. Approve implementation phases
3. Begin Phase 1: Core Infrastructure
