# Data Flow Architecture - 5-Role System

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYBOOKD PLATFORM                           │
│                   5-Role System Architecture                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Firebase Auth  │
                    │   (Sign In)     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Role Detection │
                    │  (from users/)  │
                    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ athlete │          │  coach  │          │  admin  │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        ▼                     ▼                     ▼
   Dashboard            Dashboard            Dashboard
    Progress             Creator              Admin
```

---

## 📊 Role-Based Routing Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    User Signs In                                 │
│                  (Firebase Authentication)                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Load User Document from users/                      │
│              Read: users/{userId}.role                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │           ROLE SWITCH (5 ROLES)           │
        └─────────────────────┬─────────────────────┘
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        │         │           │           │         │
        ▼         ▼           ▼           ▼         ▼
    athlete    coach    assistant    admin    superadmin
        │         │           │           │         │
        ▼         ▼           ▼           ▼         ▼
   /dashboard  /dashboard  /dashboard  /dashboard  /dashboard
    /progress   /creator   /coaching    /admin      /admin
                                                  (+ role switcher)
```

### Route Guards

```typescript
// app/dashboard/page.tsx
if (role === 'athlete')     → redirect('/dashboard/progress')
if (role === 'coach')       → redirect('/dashboard/creator')
if (role === 'assistant')   → redirect('/dashboard/coaching')
if (role === 'admin')       → redirect('/dashboard/admin')
if (role === 'superadmin')  → redirect('/dashboard/admin')
```

---

## 🗂️ Database Collections Structure

### Master Collections

```
Firestore Root
│
├── users/                           # MASTER - All users start here
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── role: 'athlete' | 'coach' | 'assistant' | 'admin' | 'superadmin'
│       ├── photoURL: string?
│       ├── onboardingComplete: boolean
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       └── lastLoginAt: timestamp
│
├── athletes/                        # Athlete-specific data
│   └── {athleteId}/                 # athleteId = userId (same)
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── sport: string
│       ├── age: number
│       ├── skillLevel: 'beginner' | 'intermediate' | 'advanced'
│       ├── coachId: string?         # Reference to coach
│       ├── onboardingComplete: boolean
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│       │
│       ├── athleteProgress/         # Subcollection
│       │   └── {progressId}/
│       │       ├── completedSessions: number
│       │       ├── totalHours: number
│       │       ├── currentStreak: number
│       │       ├── achievements: array
│       │       └── lastActivityAt: timestamp
│       │
│       ├── athleteNotifications/    # Subcollection
│       │   └── {notificationId}/
│       │       ├── type: 'session' | 'achievement' | 'message'
│       │       ├── title: string
│       │       ├── message: string
│       │       ├── read: boolean
│       │       └── createdAt: timestamp
│       │
│       ├── athleteSessions/         # Subcollection
│       │   └── {sessionId}/
│       │       ├── coachId: string
│       │       ├── scheduledAt: timestamp
│       │       ├── status: 'proposed' | 'confirmed' | 'completed' | 'cancelled'
│       │       ├── notes: string?
│       │       └── completedAt: timestamp?
│       │
│       └── athleteGoals/            # Subcollection
│           └── {goalId}/
│               ├── title: string
│               ├── description: string
│               ├── targetDate: timestamp?
│               ├── status: 'active' | 'completed' | 'abandoned'
│               ├── progress: number (0-100)
│               └── createdAt: timestamp
│
├── coaches/                         # Coach-specific data
│   └── {coachId}/                   # coachId = userId (same)
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── slug: string             # URL-friendly name
│       ├── sport: string
│       ├── bio: string
│       ├── certifications: array
│       ├── specialties: array
│       ├── verified: boolean
│       ├── status: 'pending' | 'approved' | 'suspended'
│       ├── isActive: boolean
│       ├── featured: boolean
│       ├── onboardingComplete: boolean
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── approvedAt: timestamp?
│       └── approvedBy: string?
│       │
│       ├── coachAthletes/           # Subcollection
│       │   └── {athleteId}/
│       │       ├── athleteId: string (reference)
│       │       ├── displayName: string
│       │       ├── sport: string
│       │       ├── status: 'active' | 'inactive'
│       │       └── startedAt: timestamp
│       │
│       └── coachContent/            # Subcollection
│           └── {contentId}/
│               ├── title: string
│               ├── type: 'video' | 'lesson' | 'program'
│               ├── videoUrl: string?
│               ├── published: boolean
│               └── createdAt: timestamp
│
├── assistants/                      # Assistant coach data
│   └── {assistantId}/
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── coachId: string          # Coach they assist
│       ├── permissions: array       # ['view_athletes', 'create_content', ...]
│       └── createdAt: timestamp
│
└── admins/                          # Admin/Superadmin data
    └── {adminId}/
        ├── uid: string
        ├── email: string
        ├── displayName: string
        ├── role: 'admin' | 'superadmin'
        ├── permissions: array       # ['manage_users', 'manage_content', ...]
        └── createdAt: timestamp
```

---

## 🔄 User Creation & Data Flow

### New Athlete Signs Up

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. User creates account (Firebase Auth)                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. Create document in users/ collection                         │
│    users/{userId}                                                │
│    - role: 'athlete'                                             │
│    - email, displayName, etc.                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Create document in athletes/ collection                      │
│    athletes/{userId}  (same ID)                                  │
│    - sport, skillLevel, etc.                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Create subcollections (empty, populated later)               │
│    - athleteProgress/                                            │
│    - athleteNotifications/                                       │
│    - athleteSessions/                                            │
│    - athleteGoals/                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. Redirect to /dashboard/progress                              │
└──────────────────────────────────────────────────────────────────┘
```

### New Coach Signs Up

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. User creates account (Firebase Auth)                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. User applies to be a coach                                   │
│    (or admin approves directly)                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Create document in users/ collection                         │
│    users/{userId}                                                │
│    - role: 'coach'                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Create document in coaches/ collection                       │
│    coaches/{userId}  (same ID)                                   │
│    - bio, sport, certifications, status: 'approved'              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. Create subcollections                                        │
│    - coachAthletes/ (empty)                                      │
│    - coachContent/ (empty)                                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. Redirect to /dashboard/creator                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Access Control Matrix

```
┌─────────────┬──────────┬───────┬───────────┬───────┬────────────┐
│ Resource    │ Athlete  │ Coach │ Assistant │ Admin │ Superadmin │
├─────────────┼──────────┼───────┼───────────┼───────┼────────────┤
│ Own Profile │ ✅ RW    │ ✅ RW │ ✅ RW     │ ✅ RW │ ✅ RW      │
│ Own Data    │ ✅ RW    │ ✅ RW │ ✅ R      │ ✅ RW │ ✅ RW      │
│ Athletes    │ ❌       │ ✅ R  │ ✅ R      │ ✅ RW │ ✅ RW      │
│ Coaches     │ ✅ R     │ ✅ R  │ ✅ R      │ ✅ RW │ ✅ RW      │
│ Content     │ ✅ R     │ ✅ RW │ ✅ RW     │ ✅ RW │ ✅ RW      │
│ Sessions    │ ✅ RW*   │ ✅ RW*│ ✅ RW*    │ ✅ RW │ ✅ RW      │
│ Users       │ ❌       │ ❌    │ ❌        │ ✅ RW │ ✅ RW      │
│ Admin Panel │ ❌       │ ❌    │ ❌        │ ✅ RW │ ✅ RW      │
└─────────────┴──────────┴───────┴───────────┴───────┴────────────┘

Legend:
✅ RW  = Read & Write
✅ R   = Read Only
✅ RW* = Read & Write (own data only)
❌     = No Access
```

---

## 📱 Dashboard Access Patterns

### Athlete Dashboard (`/dashboard/progress`)

```
┌──────────────────────────────────────────────────────────────────┐
│                     ATHLETE DASHBOARD                            │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Browse  │          │   My    │          │   My    │
   │ Coaches │          │Schedule │          │ Profile │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        ▼                     ▼                     ▼
   Read from            Read from            Read from
   coaches/            athleteSessions/      athletes/{id}
   creatorPublic/                           users/{id}

DATA READS:
- users/{userId}                  → Get role, name, photo
- athletes/{userId}               → Get sport, level, coach
- athleteProgress/{userId}        → Get stats, achievements
- athleteNotifications/{userId}   → Get notifications
- athleteSessions/{userId}        → Get upcoming sessions
- coaches/                        → Browse available coaches
```

### Coach Dashboard (`/dashboard/creator`)

```
┌──────────────────────────────────────────────────────────────────┐
│                      COACH DASHBOARD                             │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │   My    │          │ Create  │          │ Invite  │
   │Athletes │          │ Content │          │Athletes │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        ▼                     ▼                     ▼
   Read from            Write to             Create in
   coachAthletes/      coachContent/        invitations/

DATA READS:
- users/{userId}                  → Get role, name, photo
- coaches/{userId}                → Get bio, sport, verified
- coachAthletes/{userId}          → Get athlete list
- coachContent/{userId}           → Get lessons, videos
- sessions/                       → Get scheduled sessions

DATA WRITES:
- coachContent/{userId}           → Create lessons
- invitations/                    → Send athlete invites
- sessions/                       → Schedule sessions
```

### Admin Dashboard (`/dashboard/admin`)

```
┌──────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                             │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Manage  │          │ Approve │          │Platform │
   │  Users  │          │ Coaches │          │Settings │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        ▼                     ▼                     ▼
   Read/Write          Update role in        Update in
   users/              coaches/              feature_flags/
                       users/

DATA READS:
- users/                          → All users
- coaches/                        → All coaches
- athletes/                       → All athletes
- admins/                         → All admins
- coach_applications/             → Pending applications
- feature_flags/                  → Platform settings

DATA WRITES:
- users/                          → Update roles
- coaches/                        → Approve/reject coaches
- feature_flags/                  → Toggle features
- invitations/                    → Send admin invites
```

---

## 🔗 Data Relationships

### Athlete → Coach Relationship

```
athletes/{athleteId}
    coachId: "coach123"  ─────────┐
                                  │
                                  ▼
                           coaches/{coach123}
                                  │
                                  ▼
                           coachAthletes/{athleteId}
                               athleteId: "athleteId"
                               displayName: "..."
                               status: "active"
```

### Coach → Content Relationship

```
coaches/{coachId}
    │
    ├── coachContent/{content1}
    │       title: "Lesson 1"
    │       type: "video"
    │
    ├── coachContent/{content2}
    │       title: "Lesson 2"
    │       type: "lesson"
    │
    └── coachContent/{content3}
            title: "Program 1"
            type: "program"
```

### Athlete → Progress Tracking

```
athletes/{athleteId}
    │
    ├── athleteProgress/{progress1}
    │       completedSessions: 10
    │       totalHours: 20
    │
    ├── athleteNotifications/{notif1}
    │       type: "achievement"
    │       message: "10 sessions!"
    │
    └── athleteSessions/{session1}
            coachId: "coach123"
            status: "completed"
```

---

## 🚨 Critical Data Points

### ✅ What MUST Be Set on User Creation

**For ALL users:**
```javascript
users/{userId}
{
  uid: string,              // ✅ REQUIRED - Firebase Auth UID
  email: string,            // ✅ REQUIRED - From auth
  displayName: string,      // ✅ REQUIRED - User's name
  role: UserRole,           // ✅ REQUIRED - One of 5 roles
  onboardingComplete: bool, // ✅ REQUIRED - Track onboarding
  createdAt: timestamp,     // ✅ REQUIRED - When created
  updatedAt: timestamp,     // ✅ REQUIRED - Last update
  lastLoginAt: timestamp    // ✅ REQUIRED - Last login
}
```

**For Athletes:**
```javascript
athletes/{userId}
{
  uid: string,              // ✅ REQUIRED - Same as users/{userId}
  email: string,            // ✅ REQUIRED - Same as users
  displayName: string,      // ✅ REQUIRED - Same as users
  sport: string,            // ✅ REQUIRED - Primary sport
  skillLevel: string,       // ✅ REQUIRED - beginner/intermediate/advanced
  coachId: string?,         // ⚠️  OPTIONAL - Assigned coach (if any)
}
```

**For Coaches:**
```javascript
coaches/{userId}
{
  uid: string,              // ✅ REQUIRED - Same as users/{userId}
  email: string,            // ✅ REQUIRED - Same as users
  displayName: string,      // ✅ REQUIRED - Same as users
  slug: string,             // ✅ REQUIRED - URL-friendly name
  sport: string,            // ✅ REQUIRED - Primary sport
  bio: string,              // ✅ REQUIRED - Coach bio
  verified: boolean,        // ✅ REQUIRED - Admin verified
  status: string,           // ✅ REQUIRED - pending/approved/suspended
}
```

---

## 🔄 Data Sync Points

### When User Signs In

```
1. Firebase Auth → Get user.uid
2. Read: users/{uid}.role
3. Route based on role
4. Load role-specific data:
   - athlete → athletes/{uid}
   - coach → coaches/{uid}
   - assistant → assistants/{uid}
   - admin/superadmin → admins/{uid}
```

### When Athlete Views Progress

```
1. Read: athletes/{uid}
2. Read: athleteProgress/{uid}/latest
3. Read: athleteNotifications/{uid} (unread)
4. Read: athleteSessions/{uid} (upcoming)
5. Display on dashboard
```

### When Coach Creates Content

```
1. Create: coachContent/{uid}/{contentId}
2. Update: coaches/{uid}.stats.totalContent++
3. Optional: Notify athletes in coachAthletes/
```

---

## ⚠️ Common Pitfalls to Avoid

### ❌ DON'T DO THIS:
```javascript
// Storing role in multiple places
users/{uid}.role = 'athlete'
athletes/{uid}.role = 'athlete'  // ❌ Duplicate!

// Using old role names
users/{uid}.role = 'user'        // ❌ Should be 'athlete'
users/{uid}.role = 'creator'     // ❌ Should be 'coach'

// Orphaned data
athletes/{uid} exists
users/{uid} does NOT exist       // ❌ Missing parent!
```

### ✅ DO THIS:
```javascript
// Single source of truth
users/{uid}.role = 'athlete'     // ✅ Only here

// Use new role names
users/{uid}.role = 'athlete'     // ✅ Correct
users/{uid}.role = 'coach'       // ✅ Correct

// Keep data in sync
users/{uid} exists               // ✅ Parent exists
athletes/{uid} exists            // ✅ Child exists
athletes/{uid}.uid === users/{uid}.uid  // ✅ IDs match
```

---

## 📈 Scalability Considerations

### Data Growth Patterns

```
Small Platform (< 100 users):
users/          → 100 docs
athletes/       → 80 docs
coaches/        → 15 docs
admins/         → 5 docs

Medium Platform (1,000 users):
users/          → 1,000 docs
athletes/       → 850 docs
coaches/        → 120 docs
athleteProgress/→ 850 docs
coachContent/   → 500 docs (subcollection across coaches)

Large Platform (10,000+ users):
users/          → 10,000 docs
athletes/       → 8,500 docs
athleteProgress/→ 8,500+ docs (growing with activity)
coachContent/   → 5,000+ docs
sessions/       → 50,000+ docs (historical data)
```

### Query Optimization

```javascript
// ✅ GOOD - Uses index
const q = query(
  collection(db, 'athletes'),
  where('coachId', '==', coachId),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
  limit(10)
)

// ❌ BAD - No index, loads all data
const all = await getDocs(collection(db, 'athletes'))
const filtered = all.docs.filter(d => d.data().coachId === coachId)
```

---

## 🎯 Summary Checklist

### Before Purge:
- [ ] Understand 5-role system
- [ ] Know athlete-centric data structure
- [ ] Review access control matrix
- [ ] Understand data relationships

### After Purge:
- [ ] Only 2 accounts exist (joseph superadmin + coach)
- [ ] No mock data
- [ ] Clean slate for real users
- [ ] Role-based routing works
- [ ] Jasmine hard-coded on /contributors

### When Adding Users:
- [ ] Create in users/ first
- [ ] Set correct role (1 of 5)
- [ ] Create in role-specific collection
- [ ] Create empty subcollections
- [ ] Redirect to correct dashboard

---

**This architecture is now ready for production!** 🚀
