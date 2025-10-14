# 🧪 Testing Checklist - Recent Changes

**Date:** 2025-10-13
**Session Changes:** Bug fixes, Coach Dashboard consolidation, Profile placeholder system

---

## 📋 Table of Contents

1. [API Route Fixes](#1-api-route-fixes)
2. [Component Bug Fixes](#2-component-bug-fixes)
3. [Live Session Requests](#3-live-session-requests)
4. [Coach Dashboard Home/Today](#4-coach-dashboard-hometoday)
5. [Coach Profile Placeholder](#5-coach-profile-placeholder)
6. [Regression Testing](#6-regression-testing)

---

## 1. API Route Fixes

### Test: Firebase Admin Import Fixes

**Fixed Files:**
- `app/api/coach/schedule/route.ts`
- `app/api/athlete/coach-schedule/route.ts`
- `app/api/coach/posts/route.ts`
- `app/api/athlete/follow-coach/route.ts`
- `app/api/athlete/following/route.ts`
- `app/api/athlete/coach-feed/route.ts`
- `app/api/coach/live-sessions/count/route.ts` (NEW)

**Issue:** Import error: `'adminAuth' is not exported from '@/lib/firebase.admin'`
**Fix:** Changed to `import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'`

#### Test Cases:

**Test 1.1: Coach Schedule API**
- [ ] **Action:** As authenticated coach, call `/api/coach/schedule`
- [ ] **Expected:** Returns schedule events without import errors
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.2: Athlete Coach Schedule API**
- [ ] **Action:** As authenticated athlete with assigned coach, call `/api/athlete/coach-schedule`
- [ ] **Expected:** Returns coach's schedule events, no orderBy errors
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.3: Coach Posts API**
- [ ] **Action:** As authenticated coach, call GET `/api/coach/posts`
- [ ] **Expected:** Returns coach's posts/feed items
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.4: Follow Coach API**
- [ ] **Action:** As athlete, POST to `/api/athlete/follow-coach` with coachId
- [ ] **Expected:** Successfully creates follow relationship
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.5: Following List API**
- [ ] **Action:** As athlete, GET `/api/athlete/following`
- [ ] **Expected:** Returns list of coaches athlete follows
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.6: Athlete Feed API**
- [ ] **Action:** As athlete, GET `/api/athlete/feed`
- [ ] **Expected:** Returns feed from followed coaches
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.7: Coach Feed API**
- [ ] **Action:** As athlete, GET `/api/athlete/coach-feed?coachId=xyz`
- [ ] **Expected:** Returns specific coach's feed
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

**Test 1.8: Live Sessions Count API (NEW)**
- [ ] **Action:** As coach, GET `/api/coach/live-sessions/count`
- [ ] **Expected:** Returns `{ pendingCount: X }` without errors
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

---

## 2. Component Bug Fixes

### Test: TypeScript/JSX Errors Fixed

#### Test 2.1: Coaches Page - Duplicate Closing Tag

**File:** `app/coaches/page.tsx`
**Fix:** Changed `</Link>` to `</div>` on line 486

- [ ] **Action:** Navigate to `/coaches` page
- [ ] **Expected:** Page loads without JSX errors, all coach cards display correctly
- [ ] **Visual Check:** No layout issues, all elements properly closed
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 2.2: Coach Feed - Missing Audience Property

**File:** `app/dashboard/coach/feed/page.tsx`
**Fix:** Added `audience: 'assigned'` to handleCancelComposer reset object

- [ ] **Action:** As coach, go to `/dashboard/coach/feed`
- [ ] **Action:** Start composing a post, then click Cancel
- [ ] **Expected:** Composer resets without TypeScript errors, no console warnings
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 2.3: MyCoachPanel - Duplicate Property

**File:** `components/athlete/MyCoachPanel.tsx`
**Fix:** Changed property spread order to `{ ...sessionData, id: doc.id }`

- [ ] **Action:** As athlete, view dashboard with assigned coach
- [ ] **Action:** Open "My Coach" panel/section
- [ ] **Expected:** Next session displays correctly with proper ID
- [ ] **Check Console:** No TypeScript warnings about duplicate properties
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

---

## 3. Live Session Requests

### Test: Visibility and Notification Badge

**Issues Fixed:**
1. Removed `orderBy` to avoid composite index requirement
2. Added Firestore security rules for `liveSessionRequests` collection
3. Deployed rules: `npx firebase deploy --only firestore:rules`

#### Test 3.1: Badge Count Accuracy

- [ ] **Setup:** Create 1+ pending live session requests for test coach
- [ ] **Action:** Navigate to `/dashboard/coach-unified`
- [ ] **Expected:** "Live 1-on-1 Sessions" card shows correct badge count (e.g., "1")
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 3.2: Live Sessions Page Load

- [ ] **Action:** Click on "Live 1-on-1 Sessions" card
- [ ] **Expected:** Page loads without "Missing or insufficient permissions" error
- [ ] **Expected:** Shows all pending session requests
- [ ] **Check Console:** No Firestore permission errors
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 3.3: Session Request Display

- [ ] **Action:** View `/dashboard/coach/live-sessions` with pending requests
- [ ] **Expected:** All pending requests display with:
  - Athlete name and email
  - Preferred date and time
  - Duration
  - Topic and description
  - "Respond" button visible
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 3.4: Session Request Sorting

- [ ] **Setup:** Create multiple session requests with different timestamps
- [ ] **Action:** Load live sessions page
- [ ] **Expected:** Requests sorted by newest first (in-memory sort working)
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 3.5: Respond to Session Request

- [ ] **Action:** Click "Respond" on a pending request
- [ ] **Action:** Enter response message
- [ ] **Action:** (Optional) Add meeting link
- [ ] **Action:** Click "Confirm Session"
- [ ] **Expected:** Status updates to "confirmed" successfully
- [ ] **Expected:** Badge count decreases by 1
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 3.6: Firestore Rules - Coach Access Only

- [ ] **Setup:** Create session request for Coach A
- [ ] **Action:** As Coach B, try to access Coach A's session requests
- [ ] **Expected:** Firestore rules deny access (Coach B can't see Coach A's requests)
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 3.7: Firestore Rules - Athlete Access

- [ ] **Setup:** Athlete creates session request
- [ ] **Action:** As athlete, query their own session requests
- [ ] **Expected:** Can read their own requests
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

---

## 4. Coach Dashboard Home/Today

### Test: New Home/Today Dashboard

**New Components:**
- `app/dashboard/coach/home/page.tsx`
- `components/coach/TodaysOverview.tsx`
- `components/coach/QuickActionsPanel.tsx`
- `components/coach/PendingItemsWidget.tsx`
- `components/coach/TodaysSchedule.tsx`

**Changes:**
- Updated `app/dashboard/coach-unified/page.tsx` to include Home as default

#### Test 4.1: Unified Dashboard Default View

- [ ] **Action:** Navigate to `/dashboard/coach-unified` as coach
- [ ] **Expected:** "Home" is selected by default (activeSection = 'home')
- [ ] **Expected:** Home dashboard loads in main content area
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.2: Today's Overview Component

- [ ] **Action:** View home dashboard
- [ ] **Expected:** Displays greeting with coach's first name (e.g., "Good Morning, John!")
- [ ] **Expected:** Shows current date
- [ ] **Expected:** Shows 4 stat cards:
  - Total Athletes
  - Active Lessons
  - Upcoming Sessions
  - Pending Requests
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.3: Quick Actions Panel

- [ ] **Action:** View home dashboard
- [ ] **Expected:** Shows 6 action buttons:
  - Create Lesson
  - Schedule Session
  - Post Update
  - Announcement
  - My Athletes
  - Add Video
- [ ] **Action:** Click "Create Lesson"
- [ ] **Expected:** Navigates to `/dashboard/coach/lessons/create?embedded=true`
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.4: Pending Items Widget

- [ ] **Setup:** Create 1+ pending live session requests
- [ ] **Action:** View home dashboard
- [ ] **Expected:** Pending Items widget shows:
  - "X Live Session Request(s)"
  - "Urgent" badge if applicable
- [ ] **Action:** Click on pending item
- [ ] **Expected:** Navigates to `/dashboard/coach/live-sessions?embedded=true`
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.5: Pending Items - Empty State

- [ ] **Setup:** Ensure no pending items
- [ ] **Action:** View home dashboard
- [ ] **Expected:** Shows "All caught up! 🎉" message
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.6: Today's Schedule Widget

- [ ] **Setup:** Create coach schedule events for today
- [ ] **Action:** View home dashboard
- [ ] **Expected:** Today's Schedule shows today's events with:
  - Time
  - Event type
  - Title
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.7: Today's Schedule - Empty State

- [ ] **Setup:** No events scheduled for today
- [ ] **Action:** View home dashboard
- [ ] **Expected:** Shows "No events scheduled - Your day is clear!" message
- [ ] **Expected:** Shows "Add Event" button
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.8: Navigation from Home

- [ ] **Action:** From home dashboard, click various quick actions
- [ ] **Expected:** Each action navigates to correct embedded page
- [ ] **Expected:** Can navigate back to tools sidebar
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.9: Mobile Responsiveness - Home

- [ ] **Action:** View home dashboard on mobile (< 640px)
- [ ] **Expected:** All widgets stack vertically
- [ ] **Expected:** Stats cards remain readable
- [ ] **Expected:** Quick action buttons stack or scroll horizontally
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 4.10: Tool Count Update

- [ ] **Action:** View coach unified dashboard sidebar
- [ ] **Expected:** Shows "14 tools available" (updated from 13)
- [ ] **Expected:** Home appears as first tool in list
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

---

## 5. Coach Profile Placeholder

### Test: Complete-Looking Placeholder for New Coaches

**New Component:**
- `components/coach/CoachProfilePlaceholder.tsx`

**Changes:**
- Updated `app/coach/[id]/page.tsx` with detection logic and smart stats

#### Test 5.1: Placeholder Detection - Minimal Profile

- [ ] **Setup:** Create coach with:
  - Only name and photo
  - No bio (or bio < 50 characters)
  - No published lessons
  - No certifications
  - No achievements
- [ ] **Action:** Navigate to `/coach/[coachId]`
- [ ] **Expected:** Shows placeholder component (NOT real profile sections)
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.2: Placeholder Content - About Section

- [ ] **Action:** View minimal coach profile with placeholder
- [ ] **Expected:** About section shows:
  - Professional auto-generated bio
  - Uses coach's name and sport
  - Example: "Coach John brings a passion for Baseball..."
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.3: Placeholder Content - Specialties

- [ ] **Setup:** Coach profile with sport = "Baseball"
- [ ] **Action:** View profile placeholder
- [ ] **Expected:** Specialties section shows 5 baseball-specific tags:
  - Pitching Mechanics
  - Hitting Fundamentals
  - Defensive Positioning
  - Base Running Strategy
  - Mental Game Development
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.4: Placeholder Content - Different Sports

Test with each sport:
- [ ] Basketball → Shooting Form, Ball Handling, etc.
- [ ] Soccer → Ball Control, Passing Accuracy, etc.
- [ ] Football → Position-Specific Training, etc.
- [ ] Tennis → Serve Mechanics, etc.
- [ ] Generic sport → Fundamental Skills, Advanced Techniques, etc.
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.5: Placeholder Content - Certifications

- [ ] **Action:** View profile placeholder
- [ ] **Expected:** Certifications section shows 4 items:
  - "Certified [Sport] Coach"
  - "Sports Performance Training Certification"
  - "Athlete Development Specialist"
  - "First Aid & CPR Certified"
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.6: Placeholder Content - Achievements

- [ ] **Action:** View profile placeholder
- [ ] **Expected:** Achievements section shows 4 items:
  - "Developed training programs..."
  - "Committed to continuous learning..."
  - "Focused on building strong relationships..."
  - "Dedicated to positive environments..."
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.7: Placeholder Content - Training Content

- [ ] **Action:** View profile placeholder
- [ ] **Expected:** Training Content section shows:
  - "Building Content Library" message
  - Coach name in description
  - Professional explanation about preparing content
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.8: Placeholder Content - Call-to-Action

- [ ] **Action:** View profile placeholder
- [ ] **Expected:** Bottom section shows:
  - Teal gradient background
  - "Ready to Train?" heading
  - Personalized message with coach name and sport
  - 3 training option cards: "1-on-1", "Group", "Online"
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.9: Smart Stats - Zero Lessons

- [ ] **Setup:** Coach with 0 published lessons
- [ ] **Action:** View profile
- [ ] **Expected:** Lessons stat shows "Coming Soon" instead of "0"
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.10: Smart Stats - Zero Athletes

- [ ] **Setup:** Coach with 0 athletes
- [ ] **Action:** View profile
- [ ] **Expected:** Athletes stat shows "Ready to Coach" instead of "0"
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.11: Smart Stats - Zero Rating (New Coach)

- [ ] **Setup:** Coach with 0 athletes (no reviews possible)
- [ ] **Action:** View profile
- [ ] **Expected:** Rating stat shows "New Coach" instead of "5.0"
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.12: Real Profile Display - Has Bio

- [ ] **Setup:** Coach with bio >= 50 characters
- [ ] **Action:** View profile
- [ ] **Expected:** Shows REAL profile (not placeholder)
- [ ] **Expected:** Shows actual bio content
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.13: Real Profile Display - Has Lessons

- [ ] **Setup:** Coach with 1+ published lessons
- [ ] **Action:** View profile
- [ ] **Expected:** Shows REAL profile with lessons section
- [ ] **Expected:** Placeholder component NOT displayed
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.14: Real Profile Display - Has Credentials

- [ ] **Setup:** Coach with certifications OR achievements
- [ ] **Action:** View profile
- [ ] **Expected:** Shows REAL profile sections
- [ ] **Expected:** Placeholder component NOT displayed
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.15: Mobile Responsiveness - Placeholder

- [ ] **Action:** View placeholder profile on mobile (< 640px)
- [ ] **Expected:** All sections stack vertically
- [ ] **Expected:** Specialty tags wrap properly
- [ ] **Expected:** Call-to-action cards stack
- [ ] **Expected:** Text remains readable
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 5.16: Profile Header Still Shows

- [ ] **Action:** View minimal profile with placeholder
- [ ] **Expected:** Profile header still displays:
  - Profile photo (or initial)
  - Coach name
  - Sport
  - Contact button
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

---

## 6. Regression Testing

### Test: Ensure Existing Features Still Work

#### Test 6.1: Coach Dashboard - Other Tools

- [ ] **Action:** Navigate through all coach dashboard tools (not Home)
- [ ] **Test:** Athletes, Create Lesson, Library, Videos, Resources, etc.
- [ ] **Expected:** All tools load and function normally
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.2: Athlete Dashboard

- [ ] **Action:** Login as athlete, view dashboard
- [ ] **Expected:** Athlete dashboard loads normally
- [ ] **Expected:** No errors from coach-only features
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.3: Admin Dashboard

- [ ] **Action:** Login as admin, view admin dashboard
- [ ] **Expected:** All admin features work normally
- [ ] **Expected:** No impact from coach changes
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.4: Lesson Creation

- [ ] **Action:** As coach, create a new lesson
- [ ] **Expected:** Lesson creation flow works normally
- [ ] **Expected:** Can add videos, drills, descriptions
- [ ] **Expected:** Can publish lesson
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.5: Lesson Viewing (Athlete)

- [ ] **Action:** As athlete, view a lesson
- [ ] **Expected:** Lesson displays correctly
- [ ] **Expected:** Can mark as complete
- [ ] **Expected:** Progress tracking works
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.6: Coach Profile - Complete Profile

- [ ] **Setup:** Coach with complete profile (bio, lessons, credentials)
- [ ] **Action:** View `/coach/[coachId]`
- [ ] **Expected:** Shows FULL profile (NOT placeholder)
- [ ] **Expected:** All real sections display correctly
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.7: Public Coaches Page

- [ ] **Action:** Navigate to `/coaches`
- [ ] **Expected:** All coaches display correctly
- [ ] **Expected:** Can filter/search coaches
- [ ] **Expected:** Click on coach card opens profile
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

#### Test 6.8: Authentication Flows

- [ ] **Action:** Test login/logout
- [ ] **Action:** Test role-based redirects (coach → coach dash, athlete → athlete dash)
- [ ] **Expected:** All auth flows work normally
- [ ] **Status:** ✅ Pass / ❌ Fail
- [ ] **Notes:**

---

## 🎯 Testing Summary

### Quick Stats

- **Total Test Cases:** ___
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___
- **Not Tested:** ___

### Critical Issues Found

| Issue # | Severity | Component | Description | Status |
|---------|----------|-----------|-------------|--------|
| 1       |          |           |             |        |
| 2       |          |           |             |        |
| 3       |          |           |             |        |

### Non-Critical Issues Found

| Issue # | Priority | Component | Description | Status |
|---------|----------|-----------|-------------|--------|
| 1       |          |           |             |        |
| 2       |          |           |             |        |

---

## 📝 Test Execution Notes

**Tested By:** _______________
**Date:** _______________
**Environment:** Production / Staging / Local
**Browser:** _______________
**Mobile Device (if applicable):** _______________

### General Observations:

```
[Add any general observations, performance notes, or concerns here]
```

### Recommendations:

```
[Add any recommendations for improvements or additional testing needed]
```

---

## ✅ Sign-Off

- [ ] All critical tests passed
- [ ] All blocking issues resolved
- [ ] Documentation updated
- [ ] Ready for production

**Tested By:** _______________ **Date:** _______________
**Approved By:** _______________ **Date:** _______________
