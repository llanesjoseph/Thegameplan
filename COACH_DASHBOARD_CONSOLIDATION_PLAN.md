# Coach Dashboard Consolidation Plan
**Date:** 2025-10-13
**Goal:** Create a unified, intuitive coach dashboard with excellent UX/UI that consolidates all coaching features into logical, easy-to-access sections.

---

## Current State Audit

### Existing Features (13 Tools)
1. **My Athletes** - View and manage athletes
2. **Create Lesson** - Build training lessons
3. **Live 1-on-1 Sessions** - Manage session requests (NEW)
4. **Lesson Library** - View/edit all lessons
5. **Invite Athletes** - Send bulk invitations
6. **Video Manager** - Organize training videos
7. **Resource Library** - PDFs, links, materials
8. **Analytics** - Track engagement/progress
9. **My Profile** - Edit coach profile
10. **Announcements** - Send updates to athletes
11. **Assistant Coaches** - Manage coaching staff
12. **Recruit Fellow Coach** - Invite other coaches
13. **Gear Recommendations** - Recommend equipment

### Missing Critical Features
- ❌ **Coach's Schedule/Calendar** - Day-to-day schedule management
- ❌ **Coach's Feed** - Daily posts/updates to athletes (exists but not in unified dashboard)
- ❌ **Session Notes** - Quick notes after training sessions
- ❌ **Today's Overview** - Daily dashboard with tasks/upcoming events
- ❌ **Quick Actions** - Fast access to common tasks
- ❌ **Notifications Center** - Centralized notifications

### Current Issues
1. **Too many separate tools** - Cognitive overload (13 items in sidebar)
2. **No landing page** - Empty state when first arriving
3. **No daily view** - No "today's tasks" or schedule overview
4. **Scattered features** - Related items not grouped logically
5. **No quick actions** - Everything requires navigation
6. **Missing coach feed access** - Feed exists but not easily accessible

---

## Proposed Information Architecture

### Main Navigation Structure (4-5 Primary Sections)

#### 1. 🏠 **Home / Today's View** (NEW - Landing Page)
**Purpose:** Daily command center for coaches

**Components:**
- **Today's Overview Card**
  - Date and welcome message
  - Quick stats (athletes online, pending requests, lessons due)

- **Today's Schedule**
  - Live sessions scheduled for today
  - Events from coach's schedule
  - Quick add event button

- **Quick Actions Panel**
  - Create Lesson
  - Post Update to Feed
  - Add Session Notes
  - Schedule Live Session
  - Send Announcement

- **Pending Items**
  - Live session requests (with count badge)
  - Unread athlete messages
  - Lessons pending review

- **Recent Activity Feed**
  - Latest athlete completions
  - Recent comments
  - New sign-ups

#### 2. 👥 **Athletes** (Consolidated)
**Purpose:** Everything related to athlete management

**Sub-sections:**
- **My Athletes List**
  - View all athletes
  - Individual progress tracking

- **Athlete Analytics**
  - Engagement metrics
  - Progress reports
  - Performance trends

- **Invitations**
  - Send invites
  - Pending invitations
  - Invite history

- **Session Notes** (NEW)
  - Post-session notes for each athlete
  - Training observations
  - Goals and milestones

#### 3. 📚 **Content & Training** (Consolidated)
**Purpose:** All training materials and content creation

**Sub-sections:**
- **Lesson Library**
  - View all lessons
  - Create new lesson (inline)
  - Edit existing lessons
  - Lesson templates

- **Video Manager**
  - Video library
  - Upload videos
  - Organize by category

- **Resource Library**
  - PDFs and documents
  - Links and articles
  - Training materials

- **Gear Recommendations**
  - Equipment suggestions
  - Product links
  - Athlete purchases (if tracked)

#### 4. 📅 **Schedule & Sessions** (Consolidated)
**Purpose:** All time-based activities and live interactions

**Sub-sections:**
- **Calendar View** (NEW)
  - Monthly/Weekly/Daily views
  - Add events to schedule
  - Sync with athlete schedules

- **Live 1-on-1 Sessions**
  - Pending requests (with badge)
  - Confirmed sessions
  - Session history
  - Quick schedule button

- **Coach's Schedule** (NEW - currently separate)
  - Training times
  - Availability
  - Recurring events
  - Share schedule with athletes

#### 5. 📢 **Communication** (Consolidated)
**Purpose:** All athlete communication tools

**Sub-sections:**
- **Coach's Feed** (INTEGRATE EXISTING)
  - Post updates
  - Share content
  - Engage with athletes
  - Pinned posts

- **Announcements**
  - Send to all athletes
  - Scheduled announcements
  - Announcement history

- **Messages** (Future)
  - Direct messages with athletes
  - Group messages
  - Unread notifications

#### 6. ⚙️ **Settings & Team** (Consolidated)
**Purpose:** Profile, preferences, and team management

**Sub-sections:**
- **My Profile**
  - Edit profile
  - Public coach page
  - Bio and credentials

- **Assistant Coaches**
  - Manage staff
  - Permissions
  - Activity logs

- **Recruit Fellow Coach**
  - Invite other coaches
  - Referral tracking

- **Preferences**
  - Notification settings
  - Display preferences
  - Account settings

---

## Proposed UX/UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER (AppHeader)                                                  │
│  Coach Dashboard | Welcome back, Coach Name                          │
└─────────────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────────────────┐
│                  │                                                    │
│  LEFT SIDEBAR    │  MAIN CONTENT AREA                                │
│  (Navigation)    │                                                    │
│                  │  ┌──────────────────────────────────────────┐    │
│  🏠 Home         │  │  Dynamic Content Based on Selection      │    │
│  👥 Athletes     │  │                                          │    │
│  📚 Content      │  │  (Currently shows iframe embedding)      │    │
│  📅 Schedule     │  │                                          │    │
│  📢 Communicate  │  │  GOAL: Replace with native components    │    │
│  ⚙️ Settings     │  │                                          │    │
│                  │  └──────────────────────────────────────────┘    │
│  [Badges on      │                                                    │
│   relevant items]│                                                    │
│                  │                                                    │
└──────────────────┴──────────────────────────────────────────────────┘
```

### Visual Design Principles

#### Color System
- **Primary Action (Teal):** `#20B2AA` - Main CTAs, important actions
- **Success (Green):** `#16A34A` - Live sessions, confirmations
- **Info (Sky Blue):** `#91A6EB` - Athletes, informational items
- **Warning (Yellow):** `#FCD34D` - Pending items, needs attention
- **Urgent (Orange):** `#FF6B35` - Videos, high-priority items
- **Neutral (Black):** `#000000` - Content, resources
- **Background:** `#E8E6D8` - Warm, professional cream color

#### Component Patterns

**Dashboard Cards:**
```tsx
- Rounded corners (12px)
- Subtle shadow on hover
- Clear hierarchy (title, content, action)
- Icons for quick recognition
- Badge indicators for counts
```

**Quick Actions:**
```tsx
- Large, tappable buttons (44px+ height)
- Icon + text labels
- Grouped by category
- Primary actions prominent
```

**Navigation:**
```tsx
- Collapsible sidebar on mobile
- Badge indicators for notifications
- Active state clearly visible
- Expandable sub-sections
```

#### Mobile Responsive Approach
- **Desktop (1024px+):** Sidebar + content area
- **Tablet (768-1023px):** Collapsible sidebar
- **Mobile (<768px):** Bottom navigation or hamburger menu
- Touch-friendly tap targets (min 44px)

---

## Implementation Plan

### Phase 1: Home/Today View (Highest Priority)
**Duration:** 2-3 days

**Tasks:**
1. ✅ Create new "Home" section in navigation
2. ✅ Design and implement Today's Overview card
3. ✅ Add Today's Schedule component
4. ✅ Build Quick Actions panel
5. ✅ Create Pending Items widget
6. ✅ Add Recent Activity feed

**Files to Create:**
- `app/dashboard/coach/home/page.tsx` - Main home view
- `components/coach/TodaysOverview.tsx` - Overview card
- `components/coach/QuickActionsPanel.tsx` - Quick action buttons
- `components/coach/PendingItemsWidget.tsx` - Pending tasks
- `components/coach/RecentActivityFeed.tsx` - Activity stream

### Phase 2: Reorganize Navigation
**Duration:** 1-2 days

**Tasks:**
1. ✅ Update sidebar to show 6 main categories instead of 13 tools
2. ✅ Add expandable sub-menus for each category
3. ✅ Implement badge system across all categories
4. ✅ Set Home as default landing page
5. ✅ Update routing structure

**Files to Modify:**
- `app/dashboard/coach-unified/page.tsx` - Main dashboard structure
- Create category-based routing

### Phase 3: Integrate Coach Feed
**Duration:** 1 day

**Tasks:**
1. ✅ Move coach feed from separate page into Communication section
2. ✅ Add quick post widget to Home page
3. ✅ Add feed preview to Home page
4. ✅ Ensure seamless navigation

**Files to Modify:**
- `app/dashboard/coach/feed/page.tsx` - Integrate into new structure

### Phase 4: Calendar & Schedule Enhancement
**Duration:** 2-3 days

**Tasks:**
1. ✅ Create calendar view component
2. ✅ Integrate existing schedule features
3. ✅ Add live session scheduling
4. ✅ Show today's events on Home page
5. ✅ Add quick "Add Event" action

**Files to Create:**
- `components/coach/CoachCalendar.tsx` - Full calendar component
- `components/coach/TodaysSchedule.tsx` - Daily schedule widget
- `app/dashboard/coach/schedule/page.tsx` - Full schedule page

### Phase 5: Polish & Testing
**Duration:** 2 days

**Tasks:**
1. ✅ Mobile responsive testing
2. ✅ Accessibility audit (keyboard navigation, screen readers)
3. ✅ Performance optimization
4. ✅ User testing with coach feedback
5. ✅ Documentation updates

---

## Success Metrics

### UX Improvements
- ✅ Reduce clicks to common actions (from 2-3 to 1)
- ✅ Clear landing page (no empty state)
- ✅ All daily tasks visible without navigation
- ✅ Mobile-friendly design (no horizontal scrolling)

### Feature Completeness
- ✅ Home/Today view implemented
- ✅ All 13 existing tools accessible
- ✅ Coach feed integrated
- ✅ Calendar/schedule added
- ✅ Quick actions available

### User Feedback
- ✅ Coach can manage their day from one screen
- ✅ Intuitive navigation (no training needed)
- ✅ Professional, clean design
- ✅ Fast load times (<2 seconds)

---

## Next Steps

1. **Review this plan** - Get approval on the structure
2. **Start Phase 1** - Build the Home/Today view
3. **Iterate based on feedback** - Test with real coaches
4. **Roll out progressively** - Deploy each phase as completed

---

## Questions for Consideration

1. **Should we keep iframe embedding or use native components?**
   - Pros of iframes: Isolation, easier to embed existing pages
   - Cons of iframes: Performance, scrolling issues, accessibility
   - **Recommendation:** Gradually replace with native components

2. **Do we need a separate mobile app or is responsive web sufficient?**
   - **Recommendation:** Start with responsive web, consider PWA features

3. **Should notifications be real-time (WebSocket) or polling?**
   - **Recommendation:** Start with polling (30s interval), upgrade to WebSocket if needed

4. **How to handle coach with many athletes (100+)?**
   - **Recommendation:** Pagination, search, filters, and performance optimization

---

**Status:** Plan complete, ready for approval and implementation
**Priority:** High - Critical for coach daily workflow
**Estimated Total Time:** 8-12 days of development
