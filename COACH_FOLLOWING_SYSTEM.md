# Coach Following System Documentation

## Overview
The Coach Following system allows athletes to follow coaches they admire (even if not their assigned coach), creating a richer content feed and increasing platform engagement.

---

## Database Schema

### Collection: `coach_followers`
Purpose: Track athlete-coach following relationships

```typescript
{
  id: string                    // Auto-generated document ID
  athleteId: string            // UID of the athlete
  coachId: string              // UID of the coach being followed
  athleteName: string          // Display name of athlete (for coach's analytics)
  coachName: string            // Display name of coach (for quick reference)
  followedAt: Timestamp        // When the follow happened
  notificationsEnabled: boolean // Whether athlete wants notifications from this coach
}
```

**Indexes Required:**
- `athleteId` - For querying "who does this athlete follow?"
- `coachId` - For querying "who follows this coach?"
- Compound index: `athleteId + coachId` - For checking if following

---

## Enhanced Coach Posts Schema

### Updated: `coach_posts` collection

```typescript
{
  id: string
  coachId: string
  coachName: string
  content: string
  mediaType?: 'image' | 'video' | 'link'
  mediaUrl?: string
  linkUrl?: string
  linkTitle?: string
  linkDescription?: string
  pinned: boolean
  likes: number
  comments: number

  // 🆕 ENHANCED AUDIENCE TARGETING
  audience: 'assigned' | 'followers' | 'public'  // NEW FIELD

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Audience Types:**
1. **`assigned`** - Only visible to assigned athletes (private coaching tips)
2. **`followers`** - Visible to all followers + assigned athletes (broader motivational content)
3. **`public`** - Visible to everyone on platform (general announcements)

---

## Feed Aggregation Logic

### For Athletes Viewing Feed

**Step 1: Identify Sources**
```typescript
// Get assigned coach
const assignedCoachId = userData.coachId || userData.assignedCoachId

// Get followed coaches
const followingSnapshot = await db.collection('coach_followers')
  .where('athleteId', '==', athleteId)
  .get()
const followedCoachIds = followingSnapshot.docs.map(doc => doc.data().coachId)
```

**Step 2: Query Posts**
```typescript
// Posts from assigned coach (ALL posts)
const assignedPosts = await db.collection('coach_posts')
  .where('coachId', '==', assignedCoachId)
  .get()

// Posts from followed coaches (ONLY followers + public)
const followedPosts = await db.collection('coach_posts')
  .where('coachId', 'in', followedCoachIds)
  .where('audience', 'in', ['followers', 'public'])
  .get()

// Combine and sort by date
const allPosts = [...assignedPosts, ...followedPosts].sort((a, b) =>
  b.createdAt - a.createdAt
)
```

---

## UI Components

### 1. Follow Button Component

**Location**: Coach profiles, Browse Coaches list

**States:**
- **Not Following**: Shows "+ Follow" button (teal, prominent)
- **Following**: Shows "Following" with checkmark (gray, subtle)
- **Hover on Following**: Shows "Unfollow" (red)

**Example:**
```tsx
<button onClick={handleFollowToggle}>
  {isFollowing ? (
    <span>✓ Following</span>
  ) : (
    <span>+ Follow</span>
  )}
</button>
```

### 2. Browse Coaches - Follow Buttons

**Enhancement**: Add small "+ Follow" icon next to each coach name in the list

```
┌─────────────────────────────────┐
│ Coach Name              [+ Follow] │
│ Sport: Soccer                   │
│ "Elite training..."             │
└─────────────────────────────────┘
```

### 3. Enhanced Post Composer - Audience Selector

**Location**: Coach Dashboard → Feed → Create Post

```
┌─────────────────────────────────────┐
│ What's on your mind?                │
│ ┌─────────────────────────────┐    │
│ │ Write your message...       │    │
│ └─────────────────────────────┘    │
│                                     │
│ Who can see this post?              │
│ ○ Assigned Athletes Only            │
│   (Private coaching tips)           │
│ ○ Followers Only                    │
│   (Broader motivational content)    │
│ ○ Public / Everyone                 │
│   (Platform announcements)          │
│                                     │
│ [Cancel]  [Post to Athletes]        │
└─────────────────────────────────────┘
```

---

## API Endpoints

### Follow/Unfollow API

```typescript
// POST /api/athlete/follow-coach
// Follow a coach
Request: { coachId: string }
Response: { success: boolean, message: string }

// POST /api/athlete/unfollow-coach
// Unfollow a coach
Request: { coachId: string }
Response: { success: boolean, message: string }

// GET /api/athlete/following
// Get list of coaches this athlete follows
Response: { following: CoachSummary[] }

// GET /api/coach/followers
// Get list of athletes following this coach
Response: { followers: AthleteSummary[], count: number }
```

### Enhanced Feed API

```typescript
// GET /api/athlete/feed
// Aggregated feed from assigned coach + followed coaches
Response: {
  posts: Post[],
  sources: {
    assignedCoach: string,
    followedCoaches: string[]
  }
}
```

---

## Security & Permissions

### Firestore Rules

```javascript
// Coach Followers - Users can follow/unfollow, read own follows
match /coach_followers/{followId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == request.resource.data.athleteId;
  allow delete: if request.auth.uid == resource.data.athleteId;
}

// Enhanced Coach Posts - Visibility based on audience
match /coach_posts/{postId} {
  allow read: if request.auth != null && (
    // Public posts - everyone can read
    resource.data.audience == 'public' ||

    // Followers posts - followers + assigned can read
    (resource.data.audience == 'followers' && (
      isFollowing(request.auth.uid, resource.data.coachId) ||
      isAssignedTo(request.auth.uid, resource.data.coachId)
    )) ||

    // Assigned posts - only assigned athletes can read
    (resource.data.audience == 'assigned' &&
      isAssignedTo(request.auth.uid, resource.data.coachId))
  );

  allow write: if request.auth.uid == resource.data.coachId;
}

// Helper functions
function isFollowing(athleteId, coachId) {
  return exists(/databases/$(database)/documents/coach_followers/$(athleteId + '_' + coachId));
}

function isAssignedTo(athleteId, coachId) {
  let user = get(/databases/$(database)/documents/users/$(athleteId));
  return user.data.coachId == coachId || user.data.assignedCoachId == coachId;
}
```

---

## User Stories

### 1. Athlete Following a Coach

**Scenario**: Sarah is an aspiring soccer player assigned to Coach Mike. She discovers Coach Elena (a professional trainer) on the Browse Coaches page and wants to follow her for motivation.

**Flow:**
1. Sarah visits Browse Coaches page
2. Sees Coach Elena's profile card with "+ Follow" button
3. Clicks "+ Follow"
4. System creates record in `coach_followers`
5. Button changes to "✓ Following"
6. Sarah's feed now includes Coach Elena's "Followers" and "Public" posts
7. Sarah still sees ALL posts from her assigned coach (Mike)

### 2. Coach Posting Targeted Content

**Scenario**: Coach Mike wants to share a personalized drill with his assigned athletes only (not public).

**Flow:**
1. Coach Mike opens Feed composer
2. Writes post: "Team - here's your drill for tomorrow's practice"
3. Selects audience: "Assigned Athletes Only"
4. Posts
5. Only Mike's assigned athletes see this post
6. Athletes who follow Mike but aren't assigned do NOT see it

### 3. Coach Building Public Audience

**Scenario**: Coach Elena wants to share a motivational quote publicly to grow her following.

**Flow:**
1. Coach Elena opens Feed composer
2. Writes inspirational post
3. Selects audience: "Public / Everyone"
4. Posts
5. Post appears for:
   - Her assigned athletes
   - Athletes who follow her
   - Anyone browsing her public profile
   - Platform-wide feed (future feature)

---

## Analytics for Coaches

### Follower Stats

**Location**: Coach Dashboard → Analytics

```
┌─────────────────────────────────┐
│ Your Reach                      │
├─────────────────────────────────┤
│ Assigned Athletes: 25           │
│ Total Followers: 156            │
│ Post Views (30 days): 1,247     │
└─────────────────────────────────┘
```

---

## Benefits

### For Athletes
✅ Access motivational content from multiple coaches
✅ Learn from coaches they admire (even if not assigned)
✅ Stay updated on professional schedules of favorite coaches
✅ Build connections with broader coaching community

### For Coaches
✅ Build a public audience beyond assigned athletes
✅ Increase platform visibility and reputation
✅ Share different content types with different audiences
✅ Track follower growth and engagement

### For Platform
✅ Increased user engagement and retention
✅ More content creation from coaches
✅ Network effects (more followers = more content = more users)
✅ Differentiation from competitors

---

## Implementation Checklist

- [ ] Create `coach_followers` collection schema
- [ ] Update `coach_posts` to include `audience` field
- [ ] Build Follow/Unfollow API endpoints
- [ ] Create Follow button component
- [ ] Add Follow buttons to Browse Coaches page
- [ ] Update post composer with audience selector
- [ ] Enhance athlete feed aggregation logic
- [ ] Update Firestore security rules
- [ ] Add follower analytics to coach dashboard
- [ ] Test permission boundaries
- [ ] Add notification preferences for follows

---

## Future Enhancements

- **Follower Notifications**: Alert coaches when someone follows them
- **Suggested Coaches**: Recommend coaches to follow based on sport/interests
- **Follower-Only Content**: Special content tiers for followers
- **Verification Badges**: Highlight verified/elite coaches
- **Follow Feed Filtering**: Let athletes filter feed by coach
- **Direct Messages**: Private messaging between athletes and followed coaches
