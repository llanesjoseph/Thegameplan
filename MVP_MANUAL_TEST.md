## MVP Manual Test Guide

Purpose: A fast, reliable manual test to validate the core product works end‑to‑end for MVP.

### Quick Setup
- Install deps: `npm install`
- Run dev server: `npm run dev`
- Ensure `.env.local` contains required Firebase config and any other service keys (do not hardcode credentials).
- Optional: Install Playwright browsers for future E2E runs: `npx playwright install`

### Test Accounts
- Use two separate browsers or profiles (e.g., Chrome for coach/admin, Firefox/Incognito for athlete).
- If new to the environment, create a coach/admin account first, then invite an athlete via the app.

### Key Routes
- Dashboard entry (role-based): `/dashboard`
- Coach dashboard: `/dashboard/coach-unified`
- Athlete dashboard: `/dashboard/athlete`
- Admin dashboard: `/dashboard/admin`

---

### 1) Authentication & Role Routing (Critical)
- [ ] Sign out fully
- [ ] Sign in as athlete → visit `/dashboard` → verify redirect to `/dashboard/athlete`
- [ ] Sign in as coach → visit `/dashboard` → verify redirect to `/dashboard/coach-unified`
- [ ] Sign in as admin/superadmin → visit `/dashboard` → verify redirect to `/dashboard/admin`
- [ ] As athlete, try visiting `/dashboard/coach-unified` directly → verify access denied/redirect
- [ ] As coach, try visiting `/dashboard/admin` directly → verify access denied/redirect

Notes:
- Role routing is enforced centrally in the dashboard entry; do not assume access without proper role.

---

### 2) Invitations & Onboarding
- [ ] Sign in as coach or admin → open coach dashboard → find Invite Athletes tool/link
- [ ] Send an invitation to a new athlete email
- [ ] Open invite link in a separate browser/profile
- [ ] Complete athlete account creation
- [ ] First visit to `/dashboard/athlete` shows onboarding if required → complete it
- [ ] Verify athlete profile data persists after refresh/sign out/in

Evidence to capture:
- Screenshot of invite sent state and athlete acceptance
- Athlete `users/{uid}` document has expected fields (first name, sport, experience, onboarding flags)

---

### 3) Coach Dashboard – Core Navigation
- [ ] Visit `/dashboard/coach-unified`
- [ ] Verify key tool cards render (e.g., My Athletes, Create/Manage Content, Analytics, Profile)
- [ ] Click at least 3 cards and confirm their pages load without console errors
- [ ] Return home via dashboard navigation and confirm no unexpected redirects

---

### 4) Athlete Experience – Basics
- [ ] Visit `/dashboard/athlete` and confirm dashboard loads without console errors
- [ ] If lessons are assigned in your environment, open one and confirm page loads (videos play, sections readable)
- [ ] If no lessons exist, confirm navigation and cards function (e.g., “Request Video Review” if available)

Optional (if Video Review flow is wired):
- [ ] Open “Request Video Review” → submit valid URL, title, description
- [ ] Verify success message and check Firestore for `videoReviewRequests` document

---

### 5) Security & Permissions (Smoke)
- [ ] As athlete, attempt to access a coach/admin page → verify blocked/redirected
- [ ] As coach, attempt to access admin page → verify blocked/redirected
- [ ] Verify that sensitive pages do not flash content before redirect

---

### 6) Mobile Smoke Test (iPhone/Responsive)
- [ ] Open production or local URL on mobile (or use responsive dev tools)
- [ ] Coach dashboard card grid is tappable and readable
- [ ] Athlete dashboard layout stacks correctly; buttons are reachable; video embeds are responsive

---

### 7) Email & Password Reset (If enabled in environment)
- [ ] Forgot password flow sends email and allows reset
- [ ] Athlete invitation email contains functional link

---

### 8) Quality Bar – What to Watch
- No console errors during normal navigation
- Page transitions in under ~2 seconds (local) and ~3 seconds (prod)
- Clear validation errors on bad inputs; no silent failures

---

### Issue Logging Template
Copy for each bug found.

```
Title: <short summary>
Environment: <local/prod + browser + OS>
Role: <athlete/coach/admin>
URL/Route: <path>
Steps:
1) ...
2) ...
Expected:
- ...
Actual:
- ...
Artifacts:
- Screenshots / console logs
Severity:
- Blocker / High / Medium / Low
```

---

### Appendices
- The full, detailed checklists have been embedded below for single‑source reference.
- Use the quick sections above for fast confidence; use appendices for exhaustive coverage.

---

## Appendix A — Manual Testing Checklist (October 16, 2025)

# Manual Testing Checklist - October 16, 2025

**Total Tasks:** 40
**Focus Areas:** Voice Capture AI, Chat Persistence, AI Product Parser, Platform Stability

---

## Voice Capture & AI Integration (Tasks 1-6)

### 1. Test Coach Voice Traits Display
- [x] Log in as crucibletester1@gmail.com (COACH1)
- [x] Navigate to coach profile/settings
- [x] Verify 8 voice traits are visible and saved
- [x] Check Firebase Console: users/{uid} → voiceTraits array exists

### 2. Test AI Response with Dory Voice
- [x] Log in as an athlete assigned to COACH1
- [x] Open AI Coach chat widget (bottom right)
- [x] Ask: "How should I improve my swimming technique?"
- [x] Verify response uses Dory-like personality with ocean metaphors
- [x] Check for catchphrases like "Just keep swimming!"

### 3. Test AI Response with Different Questions
- [x] Ask: "I'm feeling unmotivated, what should I do?"
- [x] Ask: "What drills should I practice this week?"
- [x] Ask: "How do I handle pre-competition anxiety?"
- [x] Verify each response maintains coach's voice/personality

### 4. Test New Coach Voice Capture Onboarding
- [ ] Create a new coach invitation (admin panel)
- [ ] Open invitation link in incognito window
- [ ] Complete voice capture onboarding flow
- [ ] Fill in communication style, motivation approach, catchphrases
- [ ] Complete profile creation
- [ ] Verify voiceTraits saved in Firebase Console: users/{uid}

### 5. Test AI Without Voice Traits
- [ ] Create a coach invitation WITHOUT voice capture
- [ ] Complete basic onboarding
- [ ] Have an athlete ask them a question via AI
- [ ] Verify AI still responds with generic coaching style

### 6. Test Voice Traits Data Structure
- [ ] Open Firebase Console → users collection
- [ ] Find COACH1 document
- [ ] Verify voiceTraits is an array of strings
- [ ] Verify sport field is populated
- [ ] Check voiceCaptureData exists in invitations collection

---

## Chat Persistence & Real-time Sync (Tasks 7-14)

### 7. Test Chat Persistence Across Sessions
- [ ] Log in as athlete, open AI Coach chat
- [ ] Send 3 messages to your coach
- [ ] Close the chat widget
- [ ] Refresh the page
- [ ] Reopen chat - verify all 3 messages are still there
- [ ] Check timestamps are correct

### 8. Test Chat Persistence Across Devices
- [ ] Log in as athlete on desktop, send 2 messages
- [ ] Log in as same athlete on mobile/different browser
- [ ] Open chat - verify messages appear
- [ ] Send message from mobile
- [ ] Check desktop refreshes with new message

### 9. Test Real-time Chat Updates
- [ ] Open athlete chat on desktop
- [ ] Open Firebase Console → chat_messages collection
- [ ] Manually add a message document with current userId/coachId
- [ ] Verify message appears in chat immediately (no refresh needed)

### 10. Test Clear Chat Functionality
- [ ] Log in as athlete with existing chat history
- [ ] Open AI Coach chat widget
- [ ] Click trash icon in header
- [ ] Confirm deletion prompt
- [ ] Verify all messages are removed from UI
- [ ] Check Firebase Console - chat_messages should be deleted

### 11. Test Chat Message Immutability
- [ ] Open Firebase Console → chat_messages
- [ ] Try to edit an existing message document
- [ ] Verify security rules prevent updates (should fail)
- [ ] Check in browser console for permission error

### 12. Test Coach Can View Athlete Chats (Accountability)
- [ ] Log in as coach
- [ ] Go to Firebase Console → chat_messages collection
- [ ] Filter by coachId = your coach UID
- [ ] Verify you can see all athlete conversations
- [ ] Verify coach can read but not modify messages

### 13. Test Chat Message Length Limits
- [ ] Try sending a very long message (>10,000 characters)
- [ ] Verify error handling or truncation
- [ ] Try sending empty message
- [ ] Verify it's blocked

### 14. Test Chat Scroll Behavior
- [ ] Create a chat with 15+ messages
- [ ] Verify chat auto-scrolls to bottom on new message
- [ ] Manually scroll up
- [ ] Send a new message
- [ ] Verify it scrolls back to bottom

---

## AI Product Link Parser (Tasks 15-24)

### 15. Test Amazon Product Parsing
- [ ] Log in as coach
- [ ] Navigate to Gear Recommendations → Add Gear Recommendation
- [ ] Paste Amazon product URL (Nike shoes example)
- [ ] Click "Parse Link"
- [ ] Verify: name, price, description, image preview, category, tags auto-fill
- [ ] Check price format ($XXX.XX)

### 16. Test Nike.com Product Parsing
- [ ] Paste a Nike.com product URL
- [ ] Click "Parse Link"
- [ ] Verify all fields populate correctly
- [ ] Check image URL is full HTTPS URL (not relative)

### 17. Test Dick's Sporting Goods Parsing
- [ ] Paste a Dick's Sporting Goods URL (basketball, baseball glove, etc.)
- [ ] Verify AI extracts correct category from predefined list
- [ ] Check tags are sport-specific

### 18. Test Under Armour / Adidas Parsing
- [ ] Test with Under Armour product URL
- [ ] Test with Adidas product URL
- [ ] Verify both parse successfully

### 19. Test Invalid URL Handling
- [ ] Try parsing with: "not-a-url"
- [ ] Verify error message displays in red box
- [ ] Try parsing with: "https://google.com"
- [ ] Verify appropriate error message

### 20. Test Empty URL Submission
- [ ] Leave URL field empty
- [ ] Click "Parse Link" button
- [ ] Verify button is disabled OR error shows "Please enter a product URL"

### 21. Test Loading States
- [ ] Paste a valid product URL
- [ ] Click "Parse Link"
- [ ] Verify button shows spinner and "Parsing..." text
- [ ] Verify input field is disabled during parsing
- [ ] Wait for completion and check loading state clears

### 22. Test Manual Edit After Parsing
- [ ] Parse a product URL successfully
- [ ] Manually edit the description field
- [ ] Add 2 extra tags manually
- [ ] Change category dropdown
- [ ] Change price
- [ ] Click "Add Recommendation"
- [ ] Verify gear saves with your manual edits (not AI data)

### 23. Test Image Preview from Parsed Data
- [ ] Parse a product with good product image
- [ ] Verify image preview appears in the modal
- [ ] Upload a different image manually (replace AI image)
- [ ] Verify manual upload takes precedence

### 24. Test Parse Link Then Clear Form
- [ ] Parse a product successfully
- [ ] Click "Cancel" button
- [ ] Reopen the modal
- [ ] Verify form is cleared (not pre-filled with previous data)

---

## Gear Recommendations Full Flow (Tasks 25-28)

### 25. Test Manual Gear Creation (No Parser)
- [ ] Click "Add Gear Recommendation"
- [ ] Fill all fields manually (don't use parser)
- [ ] Upload image manually
- [ ] Add tags manually
- [ ] Click "Add Recommendation"
- [ ] Verify gear appears in your recommendations list

### 26. Test Gear Display on Athlete Side
- [ ] Log in as athlete
- [ ] Navigate to Gear Recommendations page
- [ ] Verify coach's gear items display
- [ ] Click on a gear item
- [ ] Verify affiliate link opens in new tab

### 27. Test Gear Filtering by Sport
- [ ] Add 3 gear items with different sports (soccer, basketball, tennis)
- [ ] Log in as athlete with sport preference
- [ ] Verify filtering works correctly
- [ ] Change sport filter and verify results update

### 28. Test Gear Search Functionality
- [ ] Add 5+ gear items with different names
- [ ] Use search bar to find specific item
- [ ] Verify search works by name, category, tags

---

## Home Button & Navigation (Tasks 29-32)

### 29. Test Coach Home Button
- [ ] Log in as coach
- [ ] Click different sidebar sections (Athletes, Feed, Schedule, Gear)
- [ ] Click Home button (house icon) from each section
- [ ] Verify it routes back to coach home dashboard each time
- [ ] Check URL shows /dashboard/coach/home

### 30. Test Athlete Home Button
- [ ] Log in as athlete
- [ ] Navigate to different sections (Progress, Feed, Gear, etc.)
- [ ] Click Home button from each section
- [ ] Verify routes to athlete dashboard home
- [ ] Check URL shows /dashboard/athlete

### 31. Test Assistant Coach Home Button
- [ ] Log in as assistant coach
- [ ] Navigate through sidebar
- [ ] Test Home button routing
- [ ] Verify lands on correct dashboard

### 32. Test Navigation Persistence
- [ ] Navigate to a specific page (e.g., Feed)
- [ ] Refresh the page
- [ ] Verify you stay on the same page (not redirected to home)

---

## Feed & Posts (Tasks 33-35)

### 33. Test Image Upload in Coach Feed
- [ ] Log in as coach
- [ ] Create a new feed post
- [ ] Add text content
- [ ] Attach an image (JPG, PNG)
- [ ] Click "Post"
- [ ] Verify image uploads successfully
- [ ] Check image displays correctly in feed
- [ ] Verify image loads on athlete feed view

### 34. Test Emoji Reactions on Posts
- [ ] Find a coach feed post
- [ ] Add emoji reactions (👍, ❤️, 🔥, 💪, etc.)
- [ ] Verify reaction count increments immediately
- [ ] Refresh page - verify reactions persist
- [ ] Click same emoji again - verify it unreacts

### 35. Test Feed Post Creation Flow
- [ ] Create text-only post
- [ ] Create post with image
- [ ] Create post with video link
- [ ] Verify all post types display correctly
- [ ] Check timestamps are accurate

---

## Invitations & Onboarding (Tasks 36-38)

### 36. Test Athlete Invitation Flow
- [ ] Log in as admin/coach
- [ ] Create new athlete invitation
- [ ] Copy invitation link
- [ ] Open in incognito window
- [ ] Complete athlete onboarding (email, password, profile)
- [ ] Verify account created with role = "athlete"
- [ ] Check Firebase Console: users/{uid}.role === "athlete"

### 37. Test Coach Invitation Flow with Voice Capture
- [ ] Create new coach invitation
- [ ] Open invitation link
- [ ] Complete voice capture step (communication style, catchphrases)
- [ ] Complete profile
- [ ] Verify voiceTraits saved to users collection
- [ ] Check role = "coach" in Firebase

### 38. Test Expired Invitation Handling
- [ ] Find an old invitation in Firebase (invitations collection)
- [ ] Try to use the invitation link
- [ ] Verify appropriate error or redirect

---

## Security & Permissions (Tasks 39-40)

### 39. Test Firestore Security Rules (Chat)
- [ ] Log in as athlete
- [ ] Open browser DevTools → Console
- [ ] Try to query another user's chat_messages (Firebase SDK)
- [ ] Verify read fails with permission error
- [ ] Try to update a chat message
- [ ] Verify update fails (immutable)
- [ ] Try to delete own messages
- [ ] Verify delete succeeds

### 40. Test Role-Based Access Control
- [ ] Log in as athlete
- [ ] Try to access /dashboard/coach URL directly
- [ ] Verify redirect or access denied
- [ ] Log in as coach
- [ ] Try to access admin panel
- [ ] Verify appropriate permissions enforced

---

## Testing Notes & Tips

### Environment Setup
- Use different browsers for multi-user testing (Chrome for coach, Firefox for athlete)
- Use incognito windows to test invitation flows
- Keep Firebase Console open in a separate tab for real-time data verification
- Clear browser cache between major test sections

### What to Document
- Take screenshots of any bugs/errors
- Note any slow performance or loading issues (>3 seconds)
- Record console errors in DevTools
- Note any UI/UX confusion or unclear messaging

### Priority Testing Order
1. **High Priority:** Tasks 1-24 (New features from recent development)
2. **Medium Priority:** Tasks 25-35 (Core platform features)
3. **Low Priority:** Tasks 36-40 (Edge cases and security)

### Success Criteria
- All 40 tasks should pass without critical errors
- Minor UI issues are acceptable if functionality works
- Performance should be responsive (<2 seconds for most actions)
- No console errors during normal operation

---

**Testing Session:** October 16, 2025
**Platform:** Crucible GamePlan
**Version:** Post-AI-Parser Integration
**Tester:** _________________
**Completion Date:** _________________
**Pass Rate:** _____ / 40 tasks

---

## Appendix B — MVP Testing Checklist (Detailed)

═══════════════════════════════════════════════════════════════
                    MVP TESTING CHECKLIST
           AthLeap - The Work Before the Win
═══════════════════════════════════════════════════════════════

Instructions: Test each item one at a time, marking them off as you complete them.
For any issues found, note the details below the item.

═══════════════════════════════════════════════════════════════
SECTION 1: AUTHENTICATION & ONBOARDING
═══════════════════════════════════════════════════════════════

☐ 1. Sign Up - New Coach Account
   - Navigate to homepage
   - Click "Sign Up" or "Get Started"
   - Create account with email/password
   - Verify email confirmation works
   - Check Firebase creates user record

☐ 2. Onboarding Flow - Coach
   - Complete coach profile setup
   - Add sport specialization
   - Upload profile photo
   - Set coaching experience level
   - Verify profile saves to Firestore

☐ 3. Sign In - Existing User
   - Sign out completely
   - Sign back in with credentials
   - Verify redirect to correct dashboard

☐ 4. Password Reset Flow
   - Click "Forgot Password"
   - Enter email
   - Receive reset email
   - Successfully reset password

═══════════════════════════════════════════════════════════════
SECTION 2: COACH LESSON CREATION
═══════════════════════════════════════════════════════════════

☐ 5. AI Lesson Generation - Football
   - Navigate to Create Lesson
   - Select "AI Generate" option
   - Choose Sport: Football
   - Choose Level: Intermediate
   - Enter Topic: "Proper Tackling Technique"
   - Generate lesson
   - VERIFY: No martial arts terminology appears
   - VERIFY: Football-specific language used

☐ 6. AI Lesson Generation - Soccer
   - Create new AI lesson
   - Choose Sport: Soccer
   - Choose Level: Beginner
   - Enter Topic: "Passing Fundamentals"
   - Generate lesson
   - VERIFY: Soccer-specific drills appear

☐ 7. Manual Lesson Creation
   - Navigate to Create Lesson
   - Select "Build Manually"
   - Fill in: Title, Sport, Level, Duration
   - Add 2-3 learning objectives
   - Add tags (e.g., "fundamentals", "beginner")
   - Click "Save Lesson"
   - Verify saves successfully

☐ 8. Browse Existing Content (NEW FEATURE)
   - Go to Create Lesson → Build Manually
   - Fill in Sport and Level first
   - Click "Browse Existing Content" button
   - VERIFY: Shows 4 sections:
     ✓ Your Previous Content
     ✓ From Other Coaches
     ✓ AI Suggestions
     ✓ External Resources (USA Football, US Soccer, etc.)
   - Try clicking "Insert" on suggested content
   - VERIFY: Content adds to lesson sections

☐ 9. Add Text Section
   - Create or edit lesson
   - Click "Text" section type
   - Add section title
   - Write content (instructions/explanations)
   - Save section

☐ 10. Add Video Section - YouTube
   - Click "Video" section type
   - Select "YouTube" as source
   - Paste YouTube URL
   - Set duration
   - VERIFY: Video preview appears
   - Save section

☐ 11. Add Drill Section
   - Click "Drill" section type
   - Add drill title
   - Write step-by-step instructions
   - Save section

☐ 12. AI Section Enhancement
   - Have at least 1 section with basic content
   - Click "AI Enhance" button on section
   - VERIFY: AI expands/improves content
   - VERIFY: Sport-specific language maintained

☐ 13. Reorder Sections
   - Create lesson with 3+ sections
   - Use "Move Up" and "Move Down" buttons
   - VERIFY: Order changes correctly

☐ 14. Delete Section
   - Click trash icon on a section
   - VERIFY: Section removes from list

☐ 15. Edit Published Lesson
   - Go to Lesson Library
   - Click edit on existing lesson
   - Make changes
   - Save
   - VERIFY: Changes persist

═══════════════════════════════════════════════════════════════
SECTION 3: ATHLETE INVITATION SYSTEM
═══════════════════════════════════════════════════════════════

☐ 16. Single Athlete Invitation
   - Navigate to "Invite Athletes" or "My Athletes"
   - Click "Invite Single Athlete"
   - Enter athlete name and email
   - Send invitation
   - VERIFY: Invitation appears in "My Athletes" as "pending"

☐ 17. Bulk Athlete Invitations
   - Navigate to Invite Athletes
   - Use bulk invite feature
   - Enter 3-5 athlete emails (comma or line separated)
   - Send invitations
   - VERIFY: All appear as pending

☐ 18. View Pending Invitations
   - Go to "My Athletes" page
   - VERIFY: Can see all pending invitations
   - VERIFY: Can click on athlete cards
   - Test on mobile (if available)

☐ 19. Resend Invitation
   - Find pending invitation
   - Click "Resend" button
   - VERIFY: Success message appears

═══════════════════════════════════════════════════════════════
SECTION 4: ATHLETE EXPERIENCE
═══════════════════════════════════════════════════════════════

☐ 20. Athlete Sign Up (Use Different Email)
   - Sign out of coach account
   - Create new account as athlete
   - Complete athlete onboarding
   - Set sport and position

☐ 21. Accept Coach Invitation
   - Check email for invitation
   - Click invitation link
   - Accept invitation
   - VERIFY: Coach appears in "My Coaches"

☐ 22. Athlete Dashboard View
   - Navigate to athlete dashboard (/dashboard/progress)
   - VERIFY: Can see assigned lessons
   - VERIFY: Can see progress tracking

☐ 23. View Lesson as Athlete
   - Click on a lesson
   - VERIFY: Can read all sections
   - VERIFY: Videos play correctly
   - VERIFY: Drills are readable

☐ 24. Complete Lesson Section
   - Mark section as complete
   - VERIFY: Progress bar updates
   - VERIFY: Coach can see completion status

☐ 25. Lesson Feed
   - Navigate to athlete feed/dashboard
   - VERIFY: Shows recently assigned lessons
   - VERIFY: Shows upcoming content

═══════════════════════════════════════════════════════════════
SECTION 5: MOBILE RESPONSIVENESS (Test on iPhone)
═══════════════════════════════════════════════════════════════

☐ 26. Mobile - Homepage
   - Open on iPhone Safari
   - VERIFY: Layout stacks properly
   - VERIFY: All buttons are tappable (44px min)
   - VERIFY: Text is readable without zooming

☐ 27. Mobile - Coach Dashboard
   - Navigate to /dashboard/coach-unified
   - VERIFY: Sidebar collapses on mobile
   - VERIFY: Tool cards are clickable
   - VERIFY: "Back to Tools" button appears when viewing tool

☐ 28. Mobile - My Athletes Page
   - Open My Athletes on mobile
   - VERIFY: Athlete cards stack vertically
   - VERIFY: Cards are clickable
   - VERIFY: Touch targets are adequate

☐ 29. Mobile - Lesson Creation
   - Try creating lesson on mobile
   - VERIFY: Form fields are usable
   - VERIFY: Buttons don't overlap
   - VERIFY: Keyboard doesn't hide inputs

☐ 30. Mobile - Lesson Viewing (Athlete)
   - View lesson as athlete on mobile
   - VERIFY: Sections display correctly
   - VERIFY: Videos are responsive
   - VERIFY: Can scroll through content

═══════════════════════════════════════════════════════════════
SECTION 6: COACH DASHBOARD & TOOLS
═══════════════════════════════════════════════════════════════

☐ 31. Navigate Coach Unified Dashboard
   - Open /dashboard/coach-unified
   - VERIFY: See 11 tool cards in sidebar
   - VERIFY: Order is correct:
     1. My Athletes
     2. Create Lesson
     3. Lesson Library
     4. Invite Athletes
     5. Video Manager
     6. Resource Library
     7. Analytics
     8. My Profile
     9. Announcements
     10. Assistant Coaches
     11. Recruit Fellow Coach

☐ 32. Lesson Library
   - Click "Lesson Library"
   - VERIFY: Shows all created lessons
   - VERIFY: Can search/filter lessons
   - VERIFY: Can edit and delete lessons

☐ 33. Analytics Dashboard
   - Click "Analytics"
   - VERIFY: Shows engagement metrics
   - VERIFY: Shows athlete completion rates

☐ 34. Profile Management
   - Click "My Profile"
   - Update profile photo
   - Update bio/description
   - Save changes
   - VERIFY: Changes appear in AppHeader

☐ 35. Announcements
   - Click "Announcements"
   - Create test announcement
   - Send to all athletes
   - VERIFY: Athletes receive notification

═══════════════════════════════════════════════════════════════
SECTION 7: FIRESTORE DATA PERSISTENCE
═══════════════════════════════════════════════════════════════

☐ 36. User Profile Data
   - Create/update profile
   - Sign out
   - Sign back in
   - VERIFY: Profile data persists

☐ 37. Lesson Data
   - Create lesson with multiple sections
   - Sign out
   - Sign back in
   - VERIFY: Lesson still exists with all sections

☐ 38. Invitation Data
   - Send athlete invitation
   - Sign out
   - Sign back in
   - VERIFY: Invitation still shows as pending

☐ 39. Cross-Device Persistence
   - Create lesson on desktop
   - Open mobile device
   - Sign in with same account
   - VERIFY: Lesson appears on mobile

═══════════════════════════════════════════════════════════════
SECTION 8: EMAIL DELIVERY
═══════════════════════════════════════════════════════════════

☐ 40. Welcome Email
   - Create new account
   - Check email inbox
   - VERIFY: Welcome email received

☐ 41. Athlete Invitation Email
   - Send athlete invitation
   - Check athlete's email
   - VERIFY: Invitation email received
   - VERIFY: Link works correctly

☐ 42. Password Reset Email
   - Request password reset
   - Check email
   - VERIFY: Reset link received
   - VERIFY: Link works

☐ 43. Announcement Email ✅ NOW IMPLEMENTED
   - Send announcement to athletes
   - Check athlete email
   - VERIFY: Announcement delivered
   - VERIFY: Urgent vs normal styling works
   - VERIFY: Sport filtering works

═══════════════════════════════════════════════════════════════
SECTION 9: ADMIN PANEL (If applicable)
═══════════════════════════════════════════════════════════════

☐ 44. Admin Dashboard Access
   - Sign in as admin/superadmin
   - Navigate to /dashboard/admin
   - VERIFY: Admin tools visible

☐ 45. User Management
   - View all users
   - Edit user role
   - VERIFY: Role change persists

☐ 46. Coach Applications
   - Navigate to coach applications
   - Review pending application
   - Approve/reject application

☐ 47. Platform Analytics
   - View platform-wide metrics
   - VERIFY: User count is accurate
   - VERIFY: Lesson count is accurate

═══════════════════════════════════════════════════════════════
SECTION 10: EDGE CASES & ERROR HANDLING
═══════════════════════════════════════════════════════════════

☐ 48. Create Lesson Without Required Fields
   - Try to save lesson without title
   - VERIFY: Validation error appears
   - VERIFY: Cannot save incomplete lesson

☐ 49. Invalid YouTube URL
   - Add video section
   - Enter invalid YouTube URL
   - VERIFY: Graceful error handling

☐ 50. Duplicate Email Invitation
   - Invite same athlete twice
   - VERIFY: System handles duplicate appropriately

☐ 51. Network Error Handling
   - Turn off internet mid-operation
   - Try to save lesson
   - VERIFY: Error message appears
   - VERIFY: Data doesn't corrupt

☐ 52. Large Content Upload
   - Create lesson with very long text (5000+ words)
   - VERIFY: Saves successfully
   - VERIFY: Displays without performance issues

═══════════════════════════════════════════════════════════════
SECTION 11: SECURITY & PERMISSIONS
═══════════════════════════════════════════════════════════════

☐ 53. Unauthorized Access - Coach Pages
   - Sign out completely
   - Try to access /dashboard/coach/lessons/create directly
   - VERIFY: Redirects to login

☐ 54. Unauthorized Access - Admin Pages
   - Sign in as coach (not admin)
   - Try to access /dashboard/admin
   - VERIFY: Access denied or redirected

☐ 55. Cross-User Data Access
   - Sign in as Coach A
   - Create private lesson
   - Sign in as Coach B
   - VERIFY: Cannot see Coach A's private lesson

☐ 56. API Authentication
   - Check browser network tab
   - VERIFY: All API calls include Authorization header
   - VERIFY: No sensitive data in URL params

═══════════════════════════════════════════════════════════════
SECTION 12: PERFORMANCE & UX
═══════════════════════════════════════════════════════════════

☐ 57. Page Load Speed
   - Clear cache
   - Load homepage
   - VERIFY: Loads in under 3 seconds

☐ 58. AI Generation Speed
   - Create AI lesson
   - Time the generation process
   - VERIFY: Completes in reasonable time (under 30 seconds)

☐ 59. Browse Content Modal Performance
   - Open "Browse Existing Content"
   - VERIFY: Loads suggestions quickly
   - VERIFY: Modal is scrollable with many items

☐ 60. Navigation Responsiveness
   - Click through multiple dashboard tools
   - VERIFY: Transitions are smooth
   - VERIFY: No layout shift/flashing

═══════════════════════════════════════════════════════════════
SECTION 13: DEPLOYMENT TO VERCEL
═══════════════════════════════════════════════════════════════

☐ 61. Commit All Changes
   - git add .
   - git commit -m "MVP ready for testing"
   - git push origin master

☐ 62. Deploy to Vercel
   - Push to main branch
   - VERIFY: Vercel auto-deploys
   - Check build logs for errors

☐ 63. Production Environment Variables
   - Verify all env vars set in Vercel
   - Check Firebase config
   - Check API keys

☐ 64. Production Smoke Test
   - Visit production URL
   - Sign in
   - Create test lesson
   - VERIFY: All features work in production

☐ 65. Production Mobile Test
   - Open production URL on iPhone
   - Test critical user flows
   - VERIFY: Mobile experience matches local

═══════════════════════════════════════════════════════════════
CRITICAL BUGS TO WATCH FOR
═══════════════════════════════════════════════════════════════

⚠️  Football coaches getting martial arts terminology
    → FIXED: AI lesson generator now uses sport-specific language

⚠️  My Athletes page not clickable on mobile
    → FIXED: Touch targets increased to 44px, cards made clickable

⚠️  Browse Existing Content not showing seed items
    → TESTED: Verify coach's previous lessons appear first

⚠️  Duplicate floating buttons in iframes
    → FIXED: Check for floating button conflicts

═══════════════════════════════════════════════════════════════
TESTING NOTES
═══════════════════════════════════════════════════════════════

Date Started: ___________________
Tester Name: ___________________

Issues Found:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

Success Criteria for MVP Launch:
☐ All authentication flows work
☐ Coaches can create lessons with AI or manually
☐ Coaches can browse and reuse existing content
☐ Athletes can view and complete lessons
☐ Invitation system works (single + bulk)
☐ Mobile experience is smooth on iPhone
☐ No critical bugs in production
☐ Email delivery confirmed

═══════════════════════════════════════════════════════════════
END OF CHECKLIST - Good luck testing! 🚀
═══════════════════════════════════════════════════════════════

