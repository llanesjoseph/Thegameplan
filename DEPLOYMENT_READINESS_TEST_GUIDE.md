# 🚀 GamePlan Deployment Readiness Testing Guide

**Last Updated:** 2025-10-17
**Version:** 2.0
**Status:** Production-Ready Verification

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Authentication & User Management](#1-authentication--user-management)
3. [Role-Based Access Control](#2-role-based-access-control)
4. [Coach Dashboard & Tools](#3-coach-dashboard--tools)
5. [Athlete Dashboard & Tools](#4-athlete-dashboard--tools)
6. [AI Coaching Assistant (Voice Integration)](#5-ai-coaching-assistant-voice-integration)
7. [Content Management](#6-content-management)
8. [Admin Features](#7-admin-features)
9. [Data Integrity & Security](#8-data-integrity--security)
10. [Performance & Responsiveness](#9-performance--responsiveness)
11. [Critical User Journeys](#10-critical-user-journeys)
12. [Production Deployment Verification](#11-production-deployment-verification)

---

## PRE-DEPLOYMENT CHECKLIST

### Environment Setup
- [ ] All environment variables configured in `.env.local`
- [ ] Firebase project credentials valid
- [ ] Firebase Admin SDK service account key present
- [ ] Build completes successfully: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All tests passing: `npm test`
- [ ] No console errors in development mode

### Firebase Configuration
- [ ] Firestore database created and accessible
- [ ] Firebase Authentication enabled
- [ ] Firebase Storage configured
- [ ] Firestore security rules deployed
- [ ] Firebase Admin initialized correctly

### Third-Party Services
- [ ] OpenAI API key configured (or marked as placeholder)
- [ ] Google Vertex AI configured (if used)
- [ ] Email service configured
- [ ] Analytics configured (if used)

---

## 1. AUTHENTICATION & USER MANAGEMENT

### Sign Up Flow

**Test: New User Registration**
1. [ ] Navigate to signup page
2. [ ] Enter valid email and password
3. [ ] Click "Sign Up"
4. [ ] **Verify:** Account created successfully
5. [ ] **Verify:** User document created in Firestore `users` collection
6. [ ] **Verify:** User redirected to appropriate dashboard based on role

**Test: Email Validation**
1. [ ] Try signing up with invalid email format (e.g., "notanemail")
2. [ ] **Verify:** Error message displays
3. [ ] **Verify:** Account not created

**Test: Password Requirements**
1. [ ] Try signing up with weak password (e.g., "123")
2. [ ] **Verify:** Error message about password strength
3. [ ] **Verify:** Account not created

**Test: Duplicate Email Prevention**
1. [ ] Try signing up with existing email
2. [ ] **Verify:** Error message about email already in use
3. [ ] **Verify:** No duplicate accounts created

### Sign In Flow

**Test: Existing User Login**
1. [ ] Navigate to login page
2. [ ] Enter valid credentials
3. [ ] Click "Sign In"
4. [ ] **Verify:** User logged in successfully
5. [ ] **Verify:** Redirected to correct dashboard based on role
6. [ ] **Verify:** User data loaded correctly

**Test: Invalid Credentials**
1. [ ] Try logging in with wrong password
2. [ ] **Verify:** Error message displays
3. [ ] **Verify:** User not logged in
4. [ ] Try logging in with non-existent email
5. [ ] **Verify:** Error message displays

**Test: Session Persistence**
1. [ ] Sign in
2. [ ] Close browser completely
3. [ ] Reopen browser and navigate to site
4. [ ] **Verify:** Still logged in
5. [ ] **Verify:** Session restored correctly

**Test: Sign Out**
1. [ ] Click sign out button
2. [ ] **Verify:** Redirected to home/login page
3. [ ] **Verify:** Session cleared
4. [ ] Try navigating to dashboard
5. [ ] **Verify:** Redirected back to login

### Password Reset
1. [ ] Click "Forgot Password"
2. [ ] Enter valid email
3. [ ] **Verify:** Reset email sent (check logs/Firebase)
4. [ ] Use reset link
5. [ ] Enter new password
6. [ ] **Verify:** Password updated successfully
7. [ ] **Verify:** Can sign in with new password

---

## 2. ROLE-BASED ACCESS CONTROL

### Athlete Role Access

**Test: Athlete Dashboard Access**
1. [ ] Sign in as athlete
2. [ ] **Verify:** Redirected to `/dashboard/athlete`
3. [ ] **Verify:** Athlete dashboard loads completely
4. [ ] **Verify:** Sidebar shows athlete tools

**Test: Athlete Cannot Access Coach Pages**
1. [ ] While signed in as athlete, try navigating to:
   - [ ] `/dashboard/coach-unified`
   - [ ] `/dashboard/coach/lessons/create`
   - [ ] `/dashboard/coach/analytics`
2. [ ] **Verify:** Access denied or redirected
3. [ ] **Verify:** No console errors

**Test: Athlete Cannot Access Admin Pages**
1. [ ] Try navigating to `/dashboard/admin`
2. [ ] **Verify:** Access denied
3. [ ] **Verify:** Error message or redirect

### Coach Role Access

**Test: Coach Dashboard Access**
1. [ ] Sign in as coach
2. [ ] **Verify:** Redirected to `/dashboard/coach-unified`
3. [ ] **Verify:** Coach dashboard loads completely
4. [ ] **Verify:** All coach tools visible in sidebar

**Test: Coach Cannot Access Admin Pages**
1. [ ] Try navigating to `/dashboard/admin`
2. [ ] **Verify:** Access denied

**Test: Coach Can Access All Coach Tools**
1. [ ] Click through each tool in sidebar:
   - [ ] Today's Overview
   - [ ] My Athletes
   - [ ] Create Content
   - [ ] Content Library
   - [ ] Messages
   - [ ] Video Reviews
   - [ ] Session Requests
   - [ ] Analytics
   - [ ] Invite Athletes
2. [ ] **Verify:** Each loads without errors

### Admin Role Access

**Test: Admin Dashboard Access**
1. [ ] Sign in as admin (super admin: llanes.joseph.m@gmail.com)
2. [ ] **Verify:** Can access `/dashboard/admin`
3. [ ] **Verify:** Admin dashboard loads

**Test: Admin Can Access Admin Features**
1. [ ] Navigate to user management
2. [ ] Navigate to analytics
3. [ ] Navigate to curated gear management
4. [ ] **Verify:** All load without errors

### Dual Roles (Coach + Athlete)

**Test: Role Switching**
1. [ ] Sign in as user with both coach and athlete roles
2. [ ] **Verify:** Lands on primary dashboard
3. [ ] Look for role switcher button
4. [ ] Click to switch roles
5. [ ] **Verify:** Dashboard changes appropriately
6. [ ] **Verify:** Can switch back

---

## 3. COACH DASHBOARD & TOOLS

### Coach Dashboard Navigation

**Test: Coach Unified Dashboard Loads**
1. [ ] Sign in as coach
2. [ ] **Verify:** Dashboard loads completely
3. [ ] **Verify:** All 12 tools display in sidebar
4. [ ] **Verify:** Welcome message shows initially
5. [ ] **Verify:** No console errors

**Test: Dashboard Button Returns to Home (CRITICAL)**
1. [ ] Click any tool in sidebar (e.g., "Lesson Library")
2. [ ] **Verify:** Tool content loads in main area
3. [ ] Click "Dashboard" button in top header (black button with home icon)
4. [ ] **Verify:** Page reloads and returns to home/welcome view
5. [ ] **Verify:** Shows "Welcome, Coach!" message
6. [ ] **Verify:** No longer showing previous tool content
7. [ ] Try clicking Dashboard button again
8. [ ] **Verify:** Still works (page reloads to home)

**Test: Sidebar Navigation Works**
1. [ ] Click through each tool in sidebar:
   - [ ] Home
   - [ ] My Profile
   - [ ] My Athletes
   - [ ] Create Lesson
   - [ ] Live 1-on-1 Sessions
   - [ ] Lesson Library
   - [ ] Invite Athletes
   - [ ] Video Manager
   - [ ] Analytics
   - [ ] Assistant Coaches
   - [ ] Recruit Fellow Coach
   - [ ] Gear Recommendations
2. [ ] **Verify:** Each loads content correctly
3. [ ] **Verify:** Active state highlights correctly
4. [ ] **Verify:** No broken links or 404 errors

**Test: Mobile View Works**
1. [ ] Set viewport to 375px width (iPhone size)
2. [ ] Click any tool to open it
3. [ ] **Verify:** "Back to Tools" button appears at bottom
4. [ ] **Verify:** Sidebar hidden when tool is open
5. [ ] Click "Back to Tools"
6. [ ] **Verify:** Returns to sidebar view
7. [ ] **Verify:** Touch targets are at least 44x44px

### Today's Overview

**Test: Dashboard Overview Display**
1. [ ] Sign in as coach
2. [ ] Navigate to "Today's Overview" or "Home"
3. [ ] **Verify:** Total athlete count displays correctly
4. [ ] **Verify:** Recent activity shows
5. [ ] **Verify:** Quick action cards display
6. [ ] **Verify:** No empty space or broken layouts
7. [ ] **Verify:** Metrics are accurate

**Test: Quick Actions Work**
1. [ ] Click quick action buttons
2. [ ] **Verify:** Navigate to correct pages
3. [ ] **Verify:** No broken links

### My Athletes

**Test: Athlete List Display**
1. [ ] Navigate to "My Athletes"
2. [ ] **Verify:** Shows all assigned athletes
3. [ ] **Verify:** Displays athlete names, emails, sports
4. [ ] **Verify:** Athlete count matches actual count
5. [ ] **Verify:** List is sorted appropriately

**Test: Athlete Details**
1. [ ] Click on an athlete
2. [ ] **Verify:** Details panel opens or navigates to profile
3. [ ] **Verify:** Shows athlete progress, engagement
4. [ ] **Verify:** All data loads correctly

**Test: No Athletes State**
1. [ ] Sign in as new coach with no athletes
2. [ ] Navigate to "My Athletes"
3. [ ] **Verify:** Empty state message displays
4. [ ] **Verify:** CTA to invite athletes shows

### Create Content

**Test: Content Creation Access**
1. [ ] Navigate to "Create Content"
2. [ ] **Verify:** Content creation interface loads
3. [ ] **Verify:** All input fields present
4. [ ] **Verify:** Can enter content details

### Content Library

**Test: Library Display**
1. [ ] Navigate to "Content Library"
2. [ ] **Verify:** Shows all coach's created content
3. [ ] **Verify:** Sorted by date (newest first)
4. [ ] **Verify:** Each item displays correctly

**Test: Edit Content**
1. [ ] Click edit on a content item
2. [ ] Make changes
3. [ ] Save changes
4. [ ] **Verify:** Changes persist
5. [ ] **Verify:** Updated in Firestore

**Test: Delete Content**
1. [ ] Click delete on test content
2. [ ] **Verify:** Confirmation dialog appears
3. [ ] Confirm deletion
4. [ ] **Verify:** Content removed from library
5. [ ] **Verify:** Deleted in Firestore

### Messages

**Test: Messaging Interface**
1. [ ] Navigate to "Messages"
2. [ ] **Verify:** Message interface loads
3. [ ] **Verify:** Athlete list shows
4. [ ] Select an athlete
5. [ ] **Verify:** Message thread loads

**Test: Send Message**
1. [ ] Type a message
2. [ ] Click send
3. [ ] **Verify:** Message appears in thread
4. [ ] **Verify:** Message saved to Firestore
5. [ ] **Verify:** Timestamp correct

**Test: Receive Message (Athlete Perspective)**
1. [ ] Send message as coach
2. [ ] Sign in as athlete
3. [ ] Navigate to messages
4. [ ] **Verify:** Coach's message appears
5. [ ] **Verify:** Real-time update (or after refresh)

### Video Reviews

**Test: Video Review Queue**
1. [ ] Navigate to "Video Reviews"
2. [ ] **Verify:** Shows pending video review requests
3. [ ] **Verify:** Displays athlete name, video, description
4. [ ] **Verify:** No requests shows empty state

**Test: Review Video Request**
1. [ ] Click on a video review request
2. [ ] **Verify:** Video loads
3. [ ] Add review comments
4. [ ] Submit review
5. [ ] **Verify:** Review saved
6. [ ] **Verify:** Athlete notified (check Firestore)
7. [ ] **Verify:** Request marked as reviewed

### Session Requests

**Test: Session Request Display**
1. [ ] Navigate to "Live 1-on-1 Sessions" or "Session Requests"
2. [ ] **Verify:** Shows pending session requests
3. [ ] **Verify:** Badge count in sidebar matches request count
4. [ ] **Verify:** Displays athlete name, preferred dates, notes

**Test: Accept Session Request**
1. [ ] Click accept on a session request
2. [ ] **Verify:** Status updates to accepted
3. [ ] **Verify:** Badge count decrements
4. [ ] **Verify:** Firestore updated
5. [ ] **Verify:** Athlete can see acceptance

**Test: Decline Session Request**
1. [ ] Click decline on a session request
2. [ ] **Verify:** Status updates to declined
3. [ ] **Verify:** Badge count decrements
4. [ ] **Verify:** Request removed or marked declined

### Analytics

**Test: Analytics Dashboard**
1. [ ] Navigate to "Analytics"
2. [ ] **Verify:** Dashboard loads
3. [ ] **Verify:** Engagement metrics display
4. [ ] **Verify:** Charts render without errors
5. [ ] **Verify:** Data is reasonable/accurate

**Test: Data Accuracy**
1. [ ] Compare displayed metrics to Firestore data
2. [ ] **Verify:** Athlete count matches
3. [ ] **Verify:** Content view counts make sense
4. [ ] **Verify:** Engagement percentages reasonable

### Invite Athletes

**Test: Invite Code Display**
1. [ ] Navigate to "Invite Athletes"
2. [ ] **Verify:** Unique coach code displays
3. [ ] **Verify:** Code is readable and copyable
4. [ ] Click copy button
5. [ ] **Verify:** Code copied to clipboard

**Test: Invite Code Works**
1. [ ] Copy coach's invite code
2. [ ] Sign up as new athlete
3. [ ] Enter coach's invite code during onboarding
4. [ ] Complete onboarding
5. [ ] **Verify:** Athlete shows up in coach's athlete list
6. [ ] **Verify:** Athlete's `coachId` matches coach's UID

### Voice Capture

**Test: Voice Capture Interface**
1. [ ] Navigate to voice capture setup (if available in UI)
2. [ ] **Verify:** All input fields present:
   - [ ] Coaching Philosophy
   - [ ] Communication Style
   - [ ] Motivation Approach
   - [ ] Catchphrases (array)
   - [ ] Key Stories (array)
   - [ ] Personality Traits (array)
   - [ ] Current Context
   - [ ] Technical Focus
3. [ ] Fill in all fields
4. [ ] Save voice data
5. [ ] **Verify:** Saved to Firestore `users` collection (NOT just `creator_profiles`)
6. [ ] **Verify:** Field names are correct (coachingPhilosophy, catchphrases, keyStories, etc.)

**Test: Voice Data Persists**
1. [ ] After saving voice data, sign out
2. [ ] Sign back in
3. [ ] Navigate back to voice capture
4. [ ] **Verify:** Previously saved data loads correctly
5. [ ] **Verify:** All fields populated

---

## 4. ATHLETE DASHBOARD & TOOLS

### Athlete Dashboard Overview

**Test: Dashboard Loads**
1. [ ] Sign in as athlete
2. [ ] **Verify:** Dashboard loads completely
3. [ ] **Verify:** Sidebar shows all athlete tools
4. [ ] **Verify:** Coach info displays at top (if assigned)
5. [ ] **Verify:** No console errors

**Test: Coach Information Display**
1. [ ] **Verify:** Coach name shows correctly
2. [ ] **Verify:** Coach photo displays (or default avatar)
3. [ ] Click coach info panel
4. [ ] **Verify:** Expands with full coach details

### AI Assistant (Ask Coach)

**Test: AI Chat Interface**
1. [ ] Click "Ask [Coach Name]" or AI assistant button
2. [ ] **Verify:** Chat interface loads
3. [ ] **Verify:** Legal consent notice appears (first time)
4. [ ] **Verify:** Input field and send button present

**Test: Legal Consent Required**
1. [ ] First time using AI, try sending message
2. [ ] **Verify:** Prompted to accept consent
3. [ ] **Verify:** Cannot use without accepting
4. [ ] Accept consent
5. [ ] **Verify:** Can now send messages
6. [ ] **Verify:** Consent saved (won't prompt again)

**Test: Send AI Message**
1. [ ] Type a question (e.g., "How do I improve my 5K time?")
2. [ ] Click send
3. [ ] **Verify:** Message appears in chat
4. [ ] **Verify:** AI response generates
5. [ ] **Verify:** Response is coherent
6. [ ] **Verify:** Chat history persists

**Test: Coach Voice Integration (CRITICAL)**
1. [ ] Ensure coach has voice data captured
2. [ ] As athlete, ask AI assistant a question
3. [ ] **Verify:** Response reflects coach's personality
4. [ ] **Verify:** Uses coach's catchphrases (if any)
5. [ ] **Verify:** Communication style matches coach's voice
6. [ ] **Verify:** Response mentions coach's name
7. [ ] **Verify:** NOT generic, impersonal response

**Test: AI Context Awareness**
1. [ ] Ask sport-specific question
2. [ ] **Verify:** Response is relevant to coach's sport
3. [ ] **Verify:** Uses appropriate terminology
4. [ ] Ask follow-up question
5. [ ] **Verify:** AI maintains context from previous message

**Test: AI Error Handling**
1. [ ] If API keys are missing/invalid:
2. [ ] **Verify:** Graceful error message
3. [ ] **Verify:** App doesn't crash
4. [ ] **Verify:** Fallback message displays

### My Content / Lessons

**Test: Content Display**
1. [ ] Navigate to "My Content" or "My Lessons"
2. [ ] **Verify:** Shows content from assigned coach
3. [ ] **Verify:** Sorted appropriately (newest first or by type)
4. [ ] **Verify:** Each content item displays correctly

**Test: View Content Details**
1. [ ] Click on a content item
2. [ ] **Verify:** Full content displays
3. [ ] **Verify:** Videos play (if embedded)
4. [ ] **Verify:** Text is readable
5. [ ] **Verify:** Images load

**Test: Content Completion**
1. [ ] View a content item
2. [ ] Click "Mark Complete" or completion button
3. [ ] **Verify:** Completion status updates
4. [ ] **Verify:** Saved to Firestore
5. [ ] **Verify:** Progress tracking updates
6. [ ] Refresh page
7. [ ] **Verify:** Still marked complete

### Video Review Request

**Test: Submit Video Review Request**
1. [ ] Navigate to "Video Review" or similar
2. [ ] **Verify:** Request form loads
3. [ ] Upload video or provide video URL
4. [ ] Add description/notes
5. [ ] Submit request
6. [ ] **Verify:** Success message
7. [ ] **Verify:** Request saved to Firestore `videoReviews` collection
8. [ ] **Verify:** Coach receives request (check coach dashboard)

**Test: Track Video Review Status**
1. [ ] After submitting request
2. [ ] Navigate to "My Video Reviews" or similar
3. [ ] **Verify:** Shows submitted requests
4. [ ] **Verify:** Shows status (pending/reviewed)
5. [ ] After coach reviews
6. [ ] **Verify:** Status updates
7. [ ] **Verify:** Can view coach's feedback

### Session Requests

**Test: Request Live Session**
1. [ ] Navigate to "Live 1-on-1 Session" or similar
2. [ ] **Verify:** Request form loads
3. [ ] Select preferred date/time
4. [ ] Add notes about what to work on
5. [ ] Submit request
6. [ ] **Verify:** Success message
7. [ ] **Verify:** Saved to Firestore `liveSessionRequests`
8. [ ] **Verify:** Coach sees request (badge count increments)

**Test: View Session Status**
1. [ ] After requesting session
2. [ ] Navigate to "My Sessions" or similar
3. [ ] **Verify:** Shows submitted requests
4. [ ] **Verify:** Shows status (pending/accepted/declined)
5. [ ] After coach responds
6. [ ] **Verify:** Status updates
7. [ ] **Verify:** Can see coach's response

### Messages

**Test: View Messages**
1. [ ] Navigate to "Messages"
2. [ ] **Verify:** Message interface loads
3. [ ] **Verify:** Shows messages from coach
4. [ ] **Verify:** Sorted by time

**Test: Send Message to Coach**
1. [ ] Type message
2. [ ] Send
3. [ ] **Verify:** Message appears in thread
4. [ ] **Verify:** Saved to Firestore
5. [ ] Sign in as coach
6. [ ] **Verify:** Coach sees athlete's message

---

## 5. AI COACHING ASSISTANT (VOICE INTEGRATION)

### Voice Data Storage (Backend Verification)

**Test: Voice Data in Users Collection**
1. [ ] Sign in as coach with voice data
2. [ ] Open Firebase Console
3. [ ] Navigate to Firestore > `users` collection
4. [ ] Find coach's user document
5. [ ] **Verify:** `voiceCaptureData` field exists
6. [ ] **Verify:** Contains:
   - [ ] `coachingPhilosophy` (string)
   - [ ] `catchphrases` (array)
   - [ ] `keyStories` (array)
   - [ ] `personalityTraits` (array)
   - [ ] `communicationStyle` (string)
   - [ ] `motivationApproach` (string)
7. [ ] **Verify:** `voiceCaptureCompleteness` field exists
8. [ ] **Verify:** Field values are NOT empty

**Test: Voice Data Migration (If Needed)**
1. [ ] Check if coach has voice data in `creator_profiles` but NOT in `users`
2. [ ] Run migration script: `node scripts/migrate-voice-data-v2.js`
3. [ ] **Verify:** Migration completes successfully
4. [ ] **Verify:** Voice data now in `users` collection
5. [ ] **Verify:** Field names correctly mapped

### Voice Integration in AI Responses

**Test: AI Uses Coach Voice (Personality Check)**
1. [ ] Sign in as athlete assigned to coach with strong personality (e.g., Dory-style, Yoda-style)
2. [ ] Open AI assistant
3. [ ] Ask: "How can I improve my performance?"
4. [ ] **Verify:** Response reflects coach's personality
5. [ ] **Verify:** Uses coach's catchphrases (if any defined)
6. [ ] **Verify:** Tone matches coach's communication style
7. [ ] **Verify:** Response is NOT generic/robotic

**Test: AI Uses Coach's Stories**
1. [ ] Coach has key stories defined
2. [ ] As athlete, ask relevant question
3. [ ] **Verify:** AI may reference coach's stories
4. [ ] **Verify:** Stories are relevant to question

**Test: AI Coaching Philosophy Integration**
1. [ ] Coach has coaching philosophy defined
2. [ ] As athlete, ask for general advice
3. [ ] **Verify:** Response aligns with coach's philosophy
4. [ ] **Verify:** Philosophy influences advice given

**Test: Voice Integration Logging**
1. [ ] Check server logs during AI request
2. [ ] **Verify:** Log shows "Extracted voice traits from voiceCaptureData"
3. [ ] **Verify:** Log shows trait counts:
   - [ ] `has_philosophy: true`
   - [ ] `has_catchphrases: true` (if catchphrases exist)
   - [ ] `has_stories: true` (if stories exist)
   - [ ] `traits_count: X` (where X > 0)
4. [ ] **Verify:** NO warning: "NO VOICE TRAITS FOUND"

### Voice Data for New Coaches (Auto-Save Test)

**Test: New Coach Voice Capture Auto-Saves**
1. [ ] Sign up as new coach
2. [ ] Complete onboarding with voice capture
3. [ ] **Verify:** Voice data saves to `users` collection immediately
4. [ ] **Verify:** NOT only saved to `creator_profiles`
5. [ ] Sign out and back in
6. [ ] Invite test athlete
7. [ ] As athlete, use AI assistant
8. [ ] **Verify:** AI uses new coach's voice immediately
9. [ ] **Verify:** No manual migration needed

### Backward Compatibility Test

**Test: Old Format Voice Data Still Works**
1. [ ] If any coaches have old format voice data:
   - [ ] Old field: `corePhilosophy` instead of `coachingPhilosophy`
   - [ ] Old field: `favoriteSayings` instead of `catchphrases`
   - [ ] Old field: `stories` instead of `keyStories`
2. [ ] As athlete, use AI assistant
3. [ ] **Verify:** AI still extracts voice traits correctly
4. [ ] **Verify:** Old format still works (backward compatible)

---

## 6. CONTENT MANAGEMENT

### Content Creation

**Test: Create New Content**
1. [ ] Sign in as coach
2. [ ] Navigate to content creation
3. [ ] Fill in all required fields:
   - [ ] Title
   - [ ] Description
   - [ ] Sport/Category
   - [ ] Content body
4. [ ] Add media (video embed, images)
5. [ ] Publish content
6. [ ] **Verify:** Success message
7. [ ] **Verify:** Saved to Firestore `content` collection
8. [ ] **Verify:** `creatorUid` matches coach UID
9. [ ] **Verify:** `status: 'published'`

**Test: Draft Content**
1. [ ] Create content without publishing
2. [ ] Save as draft
3. [ ] **Verify:** Saved with `status: 'draft'`
4. [ ] **Verify:** Appears in coach's content library as draft
5. [ ] **Verify:** NOT visible to athletes

**Test: Edit Content**
1. [ ] Edit existing content
2. [ ] Make changes
3. [ ] Save
4. [ ] **Verify:** Changes persist
5. [ ] **Verify:** Updated timestamp
6. [ ] **Verify:** Visible to athletes (if published)

**Test: Delete Content**
1. [ ] Delete a test content item
2. [ ] Confirm deletion
3. [ ] **Verify:** Removed from library
4. [ ] **Verify:** Deleted from Firestore
5. [ ] **Verify:** No longer visible to athletes

### Content Visibility

**Test: Athletes See Coach's Content**
1. [ ] Coach creates and publishes content
2. [ ] Sign in as athlete assigned to that coach
3. [ ] Navigate to content library
4. [ ] **Verify:** Coach's content appears
5. [ ] **Verify:** Draft content does NOT appear

**Test: Athletes Don't See Other Coaches' Content**
1. [ ] Sign in as athlete assigned to Coach A
2. [ ] **Verify:** Can only see Coach A's content
3. [ ] **Verify:** Cannot see Coach B's private content

---

## 7. ADMIN FEATURES

### User Management

**Test: View All Users**
1. [ ] Sign in as admin
2. [ ] Navigate to user management
3. [ ] **Verify:** Shows list of all users
4. [ ] **Verify:** Displays roles correctly
5. [ ] **Verify:** Shows email, name, registration date

**Test: Change User Role**
1. [ ] Select a test user
2. [ ] Change role (e.g., athlete → coach)
3. [ ] Save changes
4. [ ] **Verify:** Updates in Firestore
5. [ ] Sign in as that user
6. [ ] **Verify:** Dashboard changes to new role
7. [ ] **Verify:** Permissions updated

**Test: Disable User**
1. [ ] Disable a test user account
2. [ ] Sign out
3. [ ] Try signing in as disabled user
4. [ ] **Verify:** Access denied
5. [ ] Re-enable account as admin
6. [ ] **Verify:** User can sign in again

### System Analytics

**Test: Analytics Display**
1. [ ] Navigate to admin analytics
2. [ ] **Verify:** Total user count
3. [ ] **Verify:** Coach count
4. [ ] **Verify:** Athlete count
5. [ ] **Verify:** Engagement metrics
6. [ ] **Verify:** Data is accurate (compare to Firestore)

**Test: Export Data (If Implemented)**
1. [ ] Click export button
2. [ ] **Verify:** Data exports in correct format (CSV, JSON)
3. [ ] **Verify:** Contains expected data
4. [ ] **Verify:** No sensitive data exposed inappropriately

### Curated Gear Management

**Test: Add Curated Gear**
1. [ ] Navigate to curated gear management
2. [ ] Add new gear item
3. [ ] Fill in all fields
4. [ ] Mark as featured/curated
5. [ ] Save
6. [ ] **Verify:** Saved to Firestore
7. [ ] Sign in as athlete
8. [ ] Navigate to gear shop
9. [ ] **Verify:** Curated gear appears

**Test: Edit/Remove Curated Gear**
1. [ ] Edit existing gear item
2. [ ] Save changes
3. [ ] **Verify:** Changes reflect immediately in gear shop
4. [ ] Remove gear item
5. [ ] **Verify:** No longer visible in gear shop

---

## 8. DATA INTEGRITY & SECURITY

### Firestore Security Rules

**Test: Users Cannot Access Other Users' Data**
1. [ ] Sign in as User A
2. [ ] Try to read User B's document via Firestore console or API
3. [ ] **Verify:** Permission denied
4. [ ] **Verify:** No unauthorized data access

**Test: Coaches Can Only Edit Their Own Content**
1. [ ] Coach A creates content
2. [ ] Sign in as Coach B
3. [ ] Try to edit Coach A's content
4. [ ] **Verify:** Permission denied or access blocked

**Test: Athletes Can Only See Their Coach's Content**
1. [ ] Athlete assigned to Coach A
2. [ ] Try accessing Coach B's private content
3. [ ] **Verify:** Access denied or not visible

**Test: Admins Have Elevated Access**
1. [ ] Sign in as admin
2. [ ] **Verify:** Can read/write across collections
3. [ ] **Verify:** Can modify user documents
4. [ ] **Verify:** Can access all content

### Data Validation

**Test: Required Fields Enforced**
1. [ ] Try creating content without title
2. [ ] **Verify:** Validation error
3. [ ] **Verify:** Content not created
4. [ ] Try creating user without email
5. [ ] **Verify:** Validation error

**Test: Email Format Validation**
1. [ ] Try entering invalid email formats
2. [ ] **Verify:** Rejected at form level
3. [ ] **Verify:** Rejected at API level

**Test: Role Validation**
1. [ ] Try setting invalid role (e.g., "superuser")
2. [ ] **Verify:** Only allowed roles accepted (athlete, coach, admin)

### Data Relationships

**Test: Coach-Athlete Relationship**
1. [ ] Check athlete's `coachId` in Firestore
2. [ ] **Verify:** Matches existing coach UID
3. [ ] Check coach's athlete count
4. [ ] Manually count athletes assigned to coach
5. [ ] **Verify:** Numbers match

**Test: Content-Creator Relationship**
1. [ ] Check content document `creatorUid`
2. [ ] **Verify:** Matches existing user in `users` collection
3. [ ] **Verify:** Creator still exists

**Test: Orphaned Data Handling**
1. [ ] If coach deleted (or simulate):
2. [ ] **Verify:** Athlete app doesn't crash
3. [ ] **Verify:** Graceful degradation (empty state messages)
4. [ ] **Verify:** Athlete can still access platform

---

## 9. PERFORMANCE & RESPONSIVENESS

### Page Load Times

**Test: Dashboard Load Speed**
1. [ ] Measure dashboard load time (use DevTools Performance tab)
2. [ ] **Target:** Under 3 seconds on decent connection
3. [ ] **Verify:** Loads within acceptable time
4. [ ] **Verify:** No blocking resources

**Test: Content Library Load Speed**
1. [ ] Coach with 50+ content items
2. [ ] Navigate to content library
3. [ ] **Verify:** Loads quickly
4. [ ] **Verify:** Pagination or virtualization working (if many items)

**Test: Image Optimization**
1. [ ] Check profile photos, content images
2. [ ] **Verify:** Images load quickly
3. [ ] **Verify:** Appropriate sizes (not overly large)
4. [ ] **Verify:** Using efficient formats (WebP if possible)

### Responsive Design

**Test: Mobile View (375px - iPhone)**
1. [ ] Open DevTools, set to iPhone SE (375px)
2. [ ] Navigate through all dashboards
3. [ ] **Verify:** Sidebar collapses correctly
4. [ ] **Verify:** "Back" button appears when needed
5. [ ] **Verify:** Touch targets at least 44x44px
6. [ ] **Verify:** No horizontal scroll
7. [ ] **Verify:** All buttons accessible

**Test: Tablet View (768px - iPad)**
1. [ ] Set viewport to 768px width
2. [ ] **Verify:** Sidebar and content layout appropriate
3. [ ] **Verify:** No broken layouts
4. [ ] **Verify:** Content readable

**Test: Desktop View (1920px)**
1. [ ] Set viewport to 1920px width
2. [ ] **Verify:** Max-width constraints applied
3. [ ] **Verify:** Content not stretched awkwardly
4. [ ] **Verify:** No horizontal scroll

**Test: Real Mobile Devices**
1. [ ] Test on actual iPhone
2. [ ] Test on actual Android phone
3. [ ] **Verify:** Touch interactions work
4. [ ] **Verify:** Swipe gestures (if any)
5. [ ] **Verify:** Keyboard doesn't break layout
6. [ ] **Verify:** Full functionality available

### Browser Compatibility

**Test: Chrome/Edge (Latest)**
1. [ ] Full functionality test
2. [ ] **Verify:** No console errors
3. [ ] **Verify:** All features work

**Test: Firefox (Latest)**
1. [ ] Full functionality test
2. [ ] **Verify:** No console errors
3. [ ] **Verify:** All features work

**Test: Safari (Latest, Desktop & iOS)**
1. [ ] Full functionality test
2. [ ] **Verify:** No console errors
3. [ ] **Verify:** All features work
4. [ ] Test on actual iPhone Safari
5. [ ] **Verify:** Touch interactions work
6. [ ] **Verify:** No Safari-specific bugs

### Real-time Updates (If Implemented)

**Test: Badge Counts Update**
1. [ ] Coach dashboard open
2. [ ] Athlete submits session request
3. [ ] **Verify:** Badge count increments in real-time (or after reasonable delay)

**Test: New Content Appears**
1. [ ] Coach publishes new content
2. [ ] Athlete dashboard open
3. [ ] **Verify:** New content appears (real-time or after refresh)

---

## 10. CRITICAL USER JOURNEYS

### Journey 1: New Coach Onboards New Athlete

**Steps:**
1. [ ] Coach signs in
2. [ ] Coach navigates to "Invite Athletes"
3. [ ] Coach copies invite code
4. [ ] New user signs up as athlete (separate browser/incognito)
5. [ ] Athlete enters coach's invite code during onboarding
6. [ ] Athlete completes onboarding
7. [ ] **Verify:** Athlete appears in coach's "My Athletes" list
8. [ ] **Verify:** Athlete's `coachId` set correctly in Firestore
9. [ ] **Verify:** Athlete can see coach's name/photo in dashboard
10. [ ] **Verify:** Coach's athlete count increments

**Success Criteria:**
- [ ] End-to-end flow completes without errors
- [ ] Data relationships correct in Firestore
- [ ] Both coach and athlete see each other

### Journey 2: Coach Creates Content, Athlete Consumes

**Steps:**
1. [ ] Coach signs in
2. [ ] Coach navigates to "Create Content"
3. [ ] Coach enters title, description, content body
4. [ ] Coach adds video embed (YouTube/Vimeo)
5. [ ] Coach publishes content
6. [ ] **Verify:** Success message
7. [ ] **Verify:** Appears in coach's content library
8. [ ] Sign in as athlete (assigned to this coach)
9. [ ] Navigate to "My Content" or "My Lessons"
10. [ ] **Verify:** New content appears
11. [ ] Click on content
12. [ ] **Verify:** Full content displays
13. [ ] **Verify:** Video plays
14. [ ] Mark content as complete
15. [ ] **Verify:** Completion saves
16. [ ] Sign in as coach
17. [ ] Check analytics
18. [ ] **Verify:** Completion tracked

**Success Criteria:**
- [ ] Content creation seamless
- [ ] Content immediately visible to athletes
- [ ] Completion tracking works

### Journey 3: Athlete Requests Live Session, Coach Responds

**Steps:**
1. [ ] Sign in as athlete
2. [ ] Navigate to "Live 1-on-1 Session" or "Session Requests"
3. [ ] Click to request session
4. [ ] Modal/form opens
5. [ ] Select preferred date/time
6. [ ] Add notes: "Want to work on technique"
7. [ ] Submit request
8. [ ] **Verify:** Success message
9. [ ] **Verify:** Request saved to Firestore
10. [ ] Sign in as coach (same or different browser)
11. [ ] **Verify:** Badge notification appears (or increments)
12. [ ] Navigate to "Session Requests"
13. [ ] **Verify:** Athlete's request appears
14. [ ] **Verify:** Shows athlete name, date preference, notes
15. [ ] Coach clicks "Accept"
16. [ ] **Verify:** Status updates to accepted
17. [ ] **Verify:** Badge count decrements
18. [ ] Sign in as athlete
19. [ ] **Verify:** Request status shows "Accepted"
20. [ ] **Verify:** Can see coach's response

**Success Criteria:**
- [ ] End-to-end flow works
- [ ] Real-time or near-real-time notifications
- [ ] Status updates correctly

### Journey 4: Athlete Uses AI Assistant with Coach Voice

**Steps:**
1. [ ] Ensure coach has voice data captured and saved to `users` collection
2. [ ] **Verify:** Coach has:
   - [ ] Coaching philosophy
   - [ ] At least 2-3 catchphrases
   - [ ] 1-2 key stories
   - [ ] Personality traits
3. [ ] Sign in as athlete assigned to this coach
4. [ ] Navigate to AI assistant / "Ask [Coach Name]"
5. [ ] Chat interface opens
6. [ ] Accept legal consent (if first time)
7. [ ] Ask question: "How can I improve my race time?"
8. [ ] Send message
9. [ ] **Verify:** AI response generates
10. [ ] **Verify:** Response reflects coach's personality
11. [ ] **Verify:** Uses coach's catchphrases (e.g., "Just keep swimming" for Dory-style)
12. [ ] **Verify:** Tone matches coach's communication style
13. [ ] **Verify:** Response is personalized, not generic
14. [ ] **Verify:** Mentions coach's name
15. [ ] Ask follow-up question
16. [ ] **Verify:** AI maintains context
17. [ ] Check server logs
18. [ ] **Verify:** Log shows voice traits extracted
19. [ ] **Verify:** No "NO VOICE TRAITS FOUND" warning

**Success Criteria:**
- [ ] AI uses coach's voice successfully
- [ ] Personality clearly evident in responses
- [ ] Not generic/robotic
- [ ] Voice data correctly extracted from database

### Journey 5: New Coach Signs Up with Voice Capture

**Steps:**
1. [ ] Sign up as new coach
2. [ ] Complete profile information
3. [ ] Reach voice capture step in onboarding
4. [ ] Fill in voice capture fields:
   - [ ] Coaching Philosophy: "I believe in..."
   - [ ] Communication Style: "Direct and encouraging"
   - [ ] Catchphrases: ["No pain, no gain", "You got this"]
   - [ ] Key Stories: ["Story about persistence..."]
   - [ ] Personality Traits: ["Energetic", "Supportive"]
5. [ ] Complete onboarding
6. [ ] **Verify:** Redirected to coach dashboard
7. [ ] Open Firebase Console
8. [ ] Navigate to `users` collection
9. [ ] Find new coach's document
10. [ ] **Verify:** `voiceCaptureData` field exists
11. [ ] **Verify:** All voice fields saved correctly
12. [ ] **Verify:** Field names are correct (coachingPhilosophy, catchphrases, etc.)
13. [ ] **Verify:** Data NOT empty
14. [ ] Sign up as athlete with this new coach's invite code
15. [ ] Use AI assistant
16. [ ] **Verify:** AI uses new coach's voice immediately
17. [ ] **Verify:** No manual migration needed

**Success Criteria:**
- [ ] Voice capture works for new coaches
- [ ] Data saves to correct location
- [ ] AI integration works immediately
- [ ] No manual intervention required

---

## 11. PRODUCTION DEPLOYMENT VERIFICATION

### Pre-Deployment Checklist

**Build & Tests**
- [ ] `npm run build` completes with 0 errors
- [ ] `npm test` passes all tests (669+ tests)
- [ ] `npx tsc --noEmit` passes with no TypeScript errors
- [ ] No console warnings about missing dependencies

**Environment Variables (Production)**
- [ ] All env vars set in production environment (Vercel, AWS, etc.)
- [ ] Firebase config correct for production project
- [ ] Firebase Admin SDK service account key configured
- [ ] API keys valid (OpenAI, Vertex AI, etc.)
- [ ] Email service configured
- [ ] Analytics configured

**Firebase Setup**
- [ ] Firestore security rules deployed: `firebase deploy --only firestore:rules`
- [ ] Firestore rules active (verify in Firebase Console)
- [ ] Firebase Storage rules deployed (if used)
- [ ] Firebase Authentication enabled
- [ ] Production database created and accessible

### Post-Deployment Verification

**Test: Production URL Loads**
1. [ ] Visit production URL
2. [ ] **Verify:** Homepage loads correctly
3. [ ] **Verify:** No blank screens
4. [ ] **Verify:** Assets load (images, styles)

**Test: SSL Certificate**
1. [ ] Check address bar for HTTPS
2. [ ] **Verify:** Valid SSL certificate
3. [ ] **Verify:** No browser security warnings
4. [ ] Click padlock icon
5. [ ] **Verify:** Certificate details valid

**Test: Sign In Works in Production**
1. [ ] Navigate to sign in page
2. [ ] Enter valid credentials
3. [ ] **Verify:** Can sign in successfully
4. [ ] **Verify:** Redirected to correct dashboard
5. [ ] **Verify:** No errors in browser console

**Test: Database Connections**
1. [ ] Sign in
2. [ ] Navigate to content library
3. [ ] **Verify:** Data loads from production Firestore
4. [ ] Create test content
5. [ ] **Verify:** Writes save correctly to production database
6. [ ] Open Firebase Console
7. [ ] **Verify:** Data appears in production Firestore

**Test: AI Assistant Works in Production**
1. [ ] Sign in as athlete
2. [ ] Open AI assistant
3. [ ] Send test message
4. [ ] **Verify:** AI response generates
5. [ ] **Verify:** No API errors
6. [ ] **Verify:** Response quality acceptable

**Test: Voice Integration Works in Production**
1. [ ] Sign in as athlete with coach who has voice data
2. [ ] Use AI assistant
3. [ ] **Verify:** Coach's personality comes through
4. [ ] **Verify:** Voice traits extracted correctly
5. [ ] Check production server logs (if accessible)
6. [ ] **Verify:** No voice trait warnings

**Test: Third-Party Integrations**
1. [ ] Video embeds load (YouTube, Vimeo)
2. [ ] Email notifications send (if implemented)
3. [ ] Analytics tracking fires (Google Analytics, etc.)
4. [ ] **Verify:** All external services work

**Test: Mobile Experience in Production**
1. [ ] Open production site on actual mobile device
2. [ ] **Verify:** Responsive layout works
3. [ ] **Verify:** Touch interactions work
4. [ ] **Verify:** No layout breaking issues

### Performance Monitoring

**Test: Production Performance**
1. [ ] Use Lighthouse in Chrome DevTools
2. [ ] Run audit on production site
3. [ ] **Target Scores:**
   - [ ] Performance: 80+
   - [ ] Accessibility: 90+
   - [ ] Best Practices: 90+
   - [ ] SEO: 80+
4. [ ] **Verify:** No critical issues

**Test: Load Times**
1. [ ] Measure production dashboard load time
2. [ ] **Target:** Under 3 seconds on 4G
3. [ ] **Verify:** Acceptable load times
4. [ ] **Verify:** Assets optimized (check Network tab)

---

## 🚨 CRITICAL BLOCKERS

**These issues MUST be fixed before production launch:**

- [ ] **Cannot sign in or sign up**
- [ ] **Coach cannot create content**
- [ ] **Athlete cannot view content**
- [ ] **Dashboards crash or infinite loop**
- [ ] **Data not saving to Firestore**
- [ ] **Major security vulnerability (unauthorized data access)**
- [ ] **Site doesn't load on mobile**
- [ ] **AI assistant completely broken**
- [ ] **Voice integration not working for ANY coach**

---

## ⚠️ HIGH PRIORITY

**These should be fixed before launch but not complete blockers:**

- [ ] **Broken layouts on one dashboard**
- [ ] **One user role not working correctly**
- [ ] **Important feature (e.g., video review) not functioning**
- [ ] **Very slow loading (>10 seconds)**
- [ ] **Forms don't validate input**
- [ ] **Error messages confusing or missing**
- [ ] **Voice integration working for some coaches but not all**

---

## 📋 MEDIUM PRIORITY

**Can be addressed post-launch:**

- [ ] **Minor UI inconsistencies**
- [ ] **Non-critical features missing**
- [ ] **Analytics not tracking perfectly**
- [ ] **Empty states could be more helpful**
- [ ] **Could use more loading spinners**

---

## 🧪 TESTING TIPS

1. **Use Test Accounts:** Create dedicated test users:
   - `testcoach@example.com` (coach role)
   - `testathlete@example.com` (athlete role)
   - `testadmin@example.com` (admin role)

2. **Test in Order:** Follow user journeys sequentially to catch workflow issues

3. **Check Firestore After Actions:** Always verify data actually saved

4. **Test Responsive:** Use DevTools device toolbar, test on real devices

5. **Clear Cache Between Tests:** Cmd/Ctrl + Shift + R for hard refresh

6. **Monitor Console:** Always have DevTools open, watch for errors

7. **Test Edge Cases:** Empty states, max limits, special characters

8. **Document Issues:** Note exact steps to reproduce bugs

9. **Prioritize Critical Paths:** Test core flows first (auth, content, AI)

10. **Test with Real Data:** Use realistic content, actual images, varied data

---

## ✅ DEPLOYMENT SIGN-OFF

**Before deploying to production, verify:**

- [ ] All critical blockers resolved
- [ ] 95%+ of test cases passing
- [ ] Core user journeys working end-to-end
- [ ] Voice integration verified working
- [ ] Security tests passed
- [ ] Performance acceptable
- [ ] Mobile experience tested on real devices
- [ ] Production environment variables configured
- [ ] Firestore security rules deployed
- [ ] Team sign-off received

**Sign-Off:**
- [ ] Development: _____________________ Date: _______
- [ ] QA: _____________________ Date: _______
- [ ] Product Owner: _____________________ Date: _______

---

## 📊 TEST EXECUTION TRACKING

### Current Status: _____ / _____ Tests Complete

**By Section:**
- [ ] Authentication & User Management: _____ / _____
- [ ] Role-Based Access Control: _____ / _____
- [ ] Coach Dashboard & Tools: _____ / _____
- [ ] Athlete Dashboard & Tools: _____ / _____
- [ ] AI Assistant (Voice Integration): _____ / _____
- [ ] Content Management: _____ / _____
- [ ] Admin Features: _____ / _____
- [ ] Data Integrity & Security: _____ / _____
- [ ] Performance & Responsiveness: _____ / _____
- [ ] Critical User Journeys: _____ / _____
- [ ] Production Deployment: _____ / _____

**Blocking Issues Found:** _____

**High Priority Issues Found:** _____

**Medium Priority Issues Found:** _____

---

## 📝 NOTES & OBSERVATIONS

Use this space to document any issues, observations, or notes during testing:

```
Date: ___________
Tester: ___________

Issues Found:
1.
2.
3.

Observations:
-
-
-

Recommendations:
-
-
-
```

---

**Version:** 2.0
**Last Updated:** 2025-10-17
**Next Review:** Before each major deployment
**Owner:** Development Team
