# Athlete-Coach Dashboard Enhancements

## Overview
This document details the database schema, API design, and implementation plan for the new athlete-coach communication and scheduling features.

## Database Schema

### Collection: `coach_posts`
Purpose: Coach's private feed/wall for motivational content and updates

```typescript
{
  id: string                    // Auto-generated document ID
  coachId: string              // UID of the coach who created the post
  coachName: string            // Display name of the coach
  content: string              // Post text content
  mediaType?: 'image' | 'video' | 'link'  // Optional media type
  mediaUrl?: string            // URL of uploaded media
  linkUrl?: string             // External link URL
  linkTitle?: string           // Title for external link
  linkDescription?: string     // Description for external link
  createdAt: Timestamp         // When post was created
  updatedAt: Timestamp         // When post was last updated
  visibility: 'all_athletes'   // Future: can expand to specific athletes/groups
  pinned: boolean              // Whether post is pinned to top
  likes: number                // Count of athlete reactions
  comments: number             // Count of athlete comments
}
```

### Collection: `coach_schedule`
Purpose: Coach's professional schedule and events shared with athletes

```typescript
{
  id: string                    // Auto-generated document ID
  coachId: string              // UID of the coach who created the event
  coachName: string            // Display name of the coach
  eventType: 'game' | 'travel' | 'speaking' | 'training' | 'other'
  title: string                // Event title
  description: string          // Event details
  location: string             // Event location
  startDate: Timestamp         // Event start date/time
  endDate?: Timestamp          // Event end date/time (optional)
  allDay: boolean              // Whether it's an all-day event
  notifyAthletes: boolean      // Whether to send notifications
  notificationSent: boolean    // Whether notification has been sent
  notifiedAt?: Timestamp       // When notification was sent
  createdAt: Timestamp         // When event was created
  updatedAt: Timestamp         // When event was last updated
  visibility: 'all_athletes'   // Future: can expand to specific athletes/groups
}
```

### Existing: `users` collection
Athlete-Coach relationship field:

```typescript
{
  // ... other user fields
  coachId?: string             // UID of assigned coach
  assignedCoachId?: string     // Alternative field name (both supported)
  // ... other user fields
}
```

### New: `next_sessions` collection
Purpose: Track upcoming 1-on-1 sessions between coach and athlete

```typescript
{
  id: string                    // Auto-generated document ID
  coachId: string              // UID of the coach
  athleteId: string            // UID of the athlete
  sessionDate: Timestamp       // Scheduled session date/time
  sessionType: 'video_call' | 'in_person' | 'phone'
  status: 'scheduled' | 'completed' | 'cancelled'
  title: string                // Session title
  notes?: string               // Optional session notes
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## Feature 1: My Coach Quick View Panel

### UI Components
1. **Sidebar Item** - Persistent coach profile card in athlete sidebar
2. **Slide-Out Panel** - Overlay panel with coach information
3. **Contact Buttons** - Direct communication options
4. **Next Session Card** - Upcoming session information

### Implementation Files
- `components/athlete/MyCoachPanel.tsx` - Slide-out panel component
- Update: `app/dashboard/athlete/page.tsx` - Add panel trigger

### Panel Contents
```
┌─────────────────────────────────┐
│  My Coach: Quick View           │
├─────────────────────────────────┤
│  [Coach Photo]                  │
│  Coach Name                     │
│  Sport: Soccer                  │
├─────────────────────────────────┤
│  Contact Options:               │
│  [Message Coach]  [Email]       │
├─────────────────────────────────┤
│  Next Session:                  │
│  📅 June 15, 2024 at 3:00 PM   │
│  Type: Video Call               │
├─────────────────────────────────┤
│  [View Full Profile]            │
└─────────────────────────────────┘
```

---

## Feature 2: Coach's Private Feed/Wall

### UI Components
1. **Post Composer** - Text input with media upload
2. **Media Uploader** - Image/video upload with Firebase Storage
3. **Link Preview** - Rich preview for external links
4. **Feed Display** - Chronological post list for athletes

### Implementation Files
- `app/dashboard/coach/feed/page.tsx` - Coach feed management page
- `components/coach/PostComposer.tsx` - Post creation component
- `components/coach/MediaUploader.tsx` - Media upload component
- `app/api/coach/posts/route.ts` - API for CRUD operations
- Update: `app/dashboard/athlete/page.tsx` - Add "Coach's Feed" tool

### Post Composer Interface
```
┌─────────────────────────────────────┐
│  What's on your mind?               │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  Write your message...      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [📷 Photo] [🎥 Video] [🔗 Link]   │
│                                     │
│  [Cancel]  [Post to Athletes]      │
└─────────────────────────────────────┘
```

---

## Feature 3: Coach's Schedule Publisher

### UI Components
1. **Calendar View** - Month/week view of events
2. **Event Creation Form** - Simple form for event details
3. **Event Type Selector** - Dropdown with predefined types
4. **Notification Toggle** - Option to notify athletes

### Implementation Files
- `app/dashboard/coach/schedule/page.tsx` - Coach schedule management
- `components/coach/EventForm.tsx` - Event creation form
- `components/coach/CalendarView.tsx` - Calendar display
- `app/api/coach/schedule/route.ts` - API for schedule CRUD
- `app/api/notifications/schedule/route.ts` - Notification sender
- Update: `app/dashboard/athlete/page.tsx` - Add "Coach's Schedule" tool

### Event Creation Form
```
┌─────────────────────────────────────┐
│  Add to Schedule                    │
├─────────────────────────────────────┤
│  Event Type: [Dropdown ▼]          │
│    • Game                           │
│    • Travel                         │
│    • Speaking Engagement            │
│    • Training Session               │
│    • Other                          │
├─────────────────────────────────────┤
│  Title: ___________________         │
│  Location: ________________         │
│  Date: [Date Picker]                │
│  Time: [Time Picker]                │
│  Notes: ___________________         │
│                                     │
│  [✓] Notify all my athletes         │
│                                     │
│  [Cancel]  [Add to Schedule]        │
└─────────────────────────────────────┘
```

---

## API Endpoints

### Coach Posts API
```typescript
// GET /api/coach/posts - Fetch coach posts
// POST /api/coach/posts - Create new post
// PUT /api/coach/posts - Update post
// DELETE /api/coach/posts - Delete post

// Athlete view
// GET /api/athlete/coach-feed?coachId=xxx - Get coach's posts
```

### Coach Schedule API
```typescript
// GET /api/coach/schedule - Fetch coach's schedule
// POST /api/coach/schedule - Create new event
// PUT /api/coach/schedule - Update event
// DELETE /api/coach/schedule - Delete event

// Athlete view
// GET /api/athlete/coach-schedule?coachId=xxx - Get coach's schedule
```

### Notifications API
```typescript
// POST /api/notifications/schedule - Send schedule notifications
// Triggered automatically when event is created with notifyAthletes = true
```

---

## Notification System

### Schedule Event Notification
When a coach creates a schedule event with "Notify athletes" enabled:

1. **Trigger**: POST to `/api/coach/schedule` with `notifyAthletes: true`
2. **Action**: System automatically:
   - Queries `users` collection for all athletes with matching `coachId`
   - Sends email notification to each athlete
   - Creates in-app notification (future feature)
   - Updates event with `notificationSent: true` and `notifiedAt: timestamp`

### Email Template
```
Subject: [Coach Name] Schedule Update: [Event Title]

Hi [Athlete Name],

Your coach [Coach Name] has a schedule update:

Event: [Event Title]
Type: [Event Type]
Date: [Date and Time]
Location: [Location]

Notes:
[Event Notes]

View the full schedule in your athlete dashboard.

- GamePlan Team
```

---

## Security & Permissions

### Firestore Rules
```javascript
// Coach Posts - Coaches can write, Athletes can read
match /coach_posts/{postId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == resource.data.coachId;
}

// Coach Schedule - Coaches can write, Athletes can read
match /coach_schedule/{eventId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == resource.data.coachId;
}

// Next Sessions - Both coach and athlete can read their sessions
match /next_sessions/{sessionId} {
  allow read: if request.auth.uid == resource.data.coachId
              || request.auth.uid == resource.data.athleteId;
  allow write: if request.auth.uid == resource.data.coachId;
}
```

---

## Implementation Order

1. ✅ **Database Schema Design** - Document collections and structure
2. **My Coach Panel** - Quick access to coach info
3. **Coach Feed/Wall** - Post creation and athlete view
4. **Coach Schedule** - Event management and athlete view
5. **Notification System** - Automated email notifications
6. **Testing & Refinement** - End-to-end testing

---

## Future Enhancements

- **Athlete Reactions**: Like/heart posts
- **Comments**: Athletes can comment on posts
- **Athlete Groups**: Target posts to specific groups
- **Push Notifications**: Real-time mobile notifications
- **Calendar Sync**: Export to Google Calendar/iCal
- **Video Uploads**: Direct video upload (currently link only)
- **Post Analytics**: View counts, engagement metrics
