# MVP Manual Testing Checklist

## Pre-Testing Setup
- [ ] Verify all environment variables are configured (.env.local)
- [ ] Confirm Firebase project is live with correct credentials
- [ ] Ensure Stripe test mode is enabled with test keys
- [ ] Build passes successfully (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)

---

## 1. AUTHENTICATION & ONBOARDING

### Sign Up Flow
- [ ] **New user can sign up with email/password**
  - Navigate to signup page
  - Enter valid email and password
  - Verify account creation
  - Check user document created in Firestore `users` collection

- [ ] **Email validation works**
  - Try invalid email formats
  - Verify error messages display correctly

- [ ] **Password requirements enforced**
  - Try weak passwords
  - Verify minimum length/complexity requirements

- [ ] **Firebase Auth integration works**
  - User shows up in Firebase Authentication console
  - UID matches between Auth and Firestore

### Sign In Flow
- [ ] **Existing user can sign in**
  - Use existing credentials
  - Verify redirect to appropriate dashboard

- [ ] **Incorrect credentials show error**
  - Try wrong password
  - Try non-existent email
  - Verify error messages are clear

- [ ] **Session persistence works**
  - Sign in, close browser, reopen
  - Verify still signed in

- [ ] **Sign out works**
  - Click sign out
  - Verify redirect to home/login
  - Verify session cleared

### Athlete Onboarding
- [ ] **Athlete onboarding modal appears for new athletes**
  - Sign up as new athlete
  - Verify modal appears on first dashboard visit

- [ ] **Can enter coach invite code**
  - Enter valid coach code
  - Verify assignment to coach
  - Check `coachId` field in user document

- [ ] **Can skip coach assignment**
  - Skip the coach code step
  - Verify can still access athlete features

- [ ] **Onboarding only shows once**
  - Complete onboarding
  - Refresh page
  - Verify modal doesn't reappear

- [ ] **Onboarding data saves correctly**
  - Complete onboarding with sport selection
  - Check Firestore for `onboardingComplete: true`

---

## 2. ROLE-BASED ACCESS CONTROL

### Athlete Role
- [ ] **Athlete sees athlete dashboard**
  - Sign in as athlete
  - Verify redirected to `/dashboard/athlete`

- [ ] **Athlete cannot access coach pages**
  - Try navigating to `/dashboard/coach-unified`
  - Try navigating to `/dashboard/coach/lessons/create`
  - Verify redirected or access denied

- [ ] **Athlete cannot access admin pages**
  - Try navigating to `/dashboard/admin`
  - Verify access denied

### Coach Role
- [ ] **Coach sees coach dashboard**
  - Sign in as coach
  - Verify redirected to `/dashboard/coach-unified`

- [ ] **Coach cannot access admin pages**
  - Try navigating to `/dashboard/admin`
  - Verify access denied

- [ ] **Coach can access all coach tools**
  - Click through each tool in sidebar
  - Verify all load without errors

### Admin Role
- [ ] **Admin sees admin dashboard**
  - Sign in as admin
  - Verify redirected to `/dashboard/admin`

- [ ] **Admin can access admin features**
  - User management
  - System analytics
  - Curated gear management

### Dual Roles (Coach + Athlete)
- [ ] **User with both roles can switch dashboards**
  - Sign in as coach/athlete combo
  - Verify "Coach Dashboard" button in athlete view
  - Click and verify navigation works

---

## 3. COACH FEATURES

### Coach Dashboard Navigation
- [ ] **Coach unified dashboard loads**
  - All 14 tools display in sidebar
  - No console errors

- [ ] **Sidebar is functional**
  - Click each tool
  - Verify iframe loads content
  - Verify active state highlights correctly

- [ ] **Mobile view works**
  - Test on mobile/narrow screen
  - Verify "Back to Tools" button appears
  - Verify sidebar collapses correctly

### Lesson Creation
- [ ] **Can create a new lesson**
  - Navigate to "Create Lesson"
  - Fill in all required fields (title, description, sport)
  - Add at least one drill
  - Click "Publish Lesson"
  - Verify success message

- [ ] **Lesson saves to Firestore**
  - Check `content` collection
  - Verify document has correct structure
  - Verify `creatorUid` matches coach UID
  - Verify `status: 'published'`

- [ ] **Can add video to lesson**
  - In lesson creation, add video embed
  - Verify video URL validation
  - Verify preview shows correctly

- [ ] **Can add drills to lesson**
  - Add multiple drills
  - Verify drill order is maintained
  - Verify drill details save correctly

- [ ] **Draft lessons save**
  - Create lesson without publishing
  - Verify saves as draft
  - Can return and edit later

### Lesson Library
- [ ] **Lesson library displays coach's lessons**
  - Navigate to "Lesson Library"
  - Verify shows all created lessons
  - Verify sorted by date (newest first)

- [ ] **Can edit existing lesson**
  - Click edit on a lesson
  - Make changes
  - Save
  - Verify changes persist

- [ ] **Can delete lesson**
  - Delete a test lesson
  - Verify confirmation dialog
  - Verify removed from library
  - Verify deleted in Firestore

### Video Manager
- [ ] **Can upload video metadata**
  - Navigate to "Video Manager"
  - Add new video with Vimeo/YouTube URL
  - Verify thumbnail displays
  - Verify saves correctly

- [ ] **Video library displays**
  - View all uploaded videos
  - Verify sorting/filtering works

### Athlete Management
- [ ] **Can view list of athletes**
  - Navigate to "My Athletes"
  - Verify shows all assigned athletes
  - Verify displays athlete names, emails

- [ ] **Can view athlete details**
  - Click on an athlete
  - Verify shows progress, engagement stats

- [ ] **Athlete count is accurate**
  - Check sidebar/dashboard athlete count
  - Manually count in Firestore
  - Verify numbers match

### Invite Athletes
- [ ] **Can generate invite code**
  - Navigate to "Invite Athletes"
  - Verify unique coach code displays
  - Verify code can be copied

- [ ] **Invite code works for athletes**
  - Sign up as new athlete
  - Enter coach's invite code
  - Verify athlete shows up in coach's athlete list

### Live 1-on-1 Sessions
- [ ] **Can view session requests**
  - Navigate to "Live 1-on-1 Sessions"
  - Verify displays pending requests
  - Verify badge count in sidebar matches

- [ ] **Can accept session request**
  - Click accept on a request
  - Verify status updates
  - Verify athlete notified (check Firestore)

- [ ] **Can decline session request**
  - Click decline on a request
  - Verify status updates
  - Verify badge count decrements

### Announcements
- [ ] **Can create announcement**
  - Navigate to "Announcements"
  - Write announcement title and message
  - Select target audience
  - Send
  - Verify saves to Firestore `announcements` collection

- [ ] **Urgent announcements work**
  - Create urgent announcement
  - Verify `urgent: true` flag
  - Check athlete view for urgent badge

### Gear Recommendations
- [ ] **Can add gear recommendation**
  - Navigate to "Gear Recommendations"
  - Add new gear item with all fields
  - Add affiliate link
  - Verify saves correctly

- [ ] **Gear displays in athlete view**
  - Sign in as athlete
  - Navigate to Gear Shop
  - Verify coach's gear shows with "Your Coach" badge

### Analytics
- [ ] **Analytics dashboard loads**
  - Navigate to "Analytics"
  - Verify displays engagement metrics
  - Verify charts render without errors

- [ ] **Data is accurate**
  - Compare displayed numbers to Firestore data
  - Verify lesson view counts make sense

### Coach Profile
- [ ] **Can edit coach profile**
  - Navigate to "My Profile"
  - Update bio, specialties, social links
  - Save changes
  - Verify updates in Firestore

- [ ] **Profile image upload works**
  - Upload new profile photo
  - Verify displays correctly
  - Verify stored in Firebase Storage

---

## 4. ATHLETE FEATURES

### Athlete Dashboard
- [ ] **Athlete dashboard loads**
  - Sign in as athlete
  - Verify sidebar shows all tools
  - Verify coach info displays at top (if assigned)

- [ ] **Coach information displays**
  - Verify coach name shows correctly
  - Verify coach photo displays
  - Click coach panel
  - Verify opens with full details

### AI Assistant
- [ ] **Can open AI assistant**
  - Click "Ask [Coach Name]"
  - Verify chat interface loads
  - Verify legal consent notice appears

- [ ] **Can send messages**
  - Type a question
  - Send message
  - Verify response generates
  - Verify chat history persists

- [ ] **Legal consent required**
  - First message should prompt consent
  - Verify cannot use without accepting
  - Accept consent
  - Verify can now use freely

- [ ] **Coach context works**
  - Ask sport-specific question
  - Verify response is relevant to coach's sport
  - Verify response mentions coach name

### My Lessons
- [ ] **Lessons from coach display**
  - Navigate to "My Lessons"
  - Verify shows lessons from assigned coach
  - Verify sorted appropriately

- [ ] **Can view lesson details**
  - Click on a lesson
  - Verify all content displays
  - Verify videos play
  - Verify drills are readable

- [ ] **Lesson completion works**
  - Complete a lesson
  - Verify "Mark Complete" button works
  - Verify completion saves to Firestore
  - Verify progress updates

### Video Review Requests
- [ ] **Can request video review**
  - Click "Video Review"
  - Upload video or provide link
  - Add description
  - Submit request
  - Verify saves to Firestore `videoReviews` collection

- [ ] **Coach receives request**
  - Sign in as coach
  - Check video review queue
  - Verify athlete's request appears

### Live 1-on-1 Session Requests
- [ ] **Can request live session**
  - Click "Live 1-on-1 Session"
  - Select preferred dates/times
  - Add notes
  - Submit request
  - Verify saves to Firestore `liveSessionRequests`

- [ ] **Coach receives request**
  - Sign in as coach
  - Verify badge count increments
  - Verify request appears in coach's view

### Announcements
- [ ] **Athlete sees coach's announcements**
  - Navigate to "Announcements"
  - Verify displays all announcements from coach
  - Verify sorted by date (newest first)

- [ ] **Urgent announcements highlighted**
  - Check for urgent announcements
  - Verify red badge/urgent styling

- [ ] **Can dismiss announcements**
  - Click X to dismiss
  - Refresh page
  - Verify stays dismissed
  - Verify badge count decrements

### Gear Shop
- [ ] **Gear shop loads**
  - Navigate to "Gear Shop"
  - Verify displays recommended gear
  - Verify clean layout (NOT nested)

- [ ] **Coach's gear prioritized**
  - Verify gear from assigned coach shows "Your Coach" badge
  - Verify coach's gear appears at top

- [ ] **Filtering works**
  - Use category filter
  - Use level filter
  - Use search
  - Verify results update correctly

- [ ] **Affiliate links work**
  - Click "View & Buy" button
  - Verify opens in new tab
  - Verify goes to correct product page

### Coach Feed
- [ ] **Feed displays updates**
  - Navigate to "Coach's Feed"
  - Verify shows recent content from coach
  - Verify displays lessons, videos, announcements

- [ ] **Can click through to content**
  - Click on a lesson in feed
  - Verify opens lesson details

### Coach Schedule
- [ ] **Schedule displays events**
  - Navigate to "Coach's Schedule"
  - Verify shows upcoming sessions/events
  - Verify calendar view works

---

## 5. ADMIN FEATURES

### User Management
- [ ] **Can view all users**
  - Navigate to admin user management
  - Verify displays list of all users
  - Verify shows roles correctly

- [ ] **Can change user roles**
  - Select a user
  - Change role (e.g., user → coach)
  - Save
  - Verify updates in Firestore
  - Verify user's dashboard changes on next login

- [ ] **Can disable/enable users**
  - Disable a test user account
  - Try signing in as that user
  - Verify access denied
  - Re-enable account
  - Verify can sign in again

### Analytics & Reporting
- [ ] **System analytics display**
  - View total users, coaches, athletes
  - View engagement metrics
  - Verify numbers are accurate

- [ ] **Can export data**
  - Export user list
  - Export usage report
  - Verify CSV/export format is correct

### Curated Gear Management
- [ ] **Can add curated gear**
  - Navigate to curated gear admin
  - Add new gear item
  - Set as featured/curated
  - Verify appears in athlete gear shops

- [ ] **Can edit/remove gear**
  - Edit existing gear item
  - Remove gear
  - Verify changes reflect immediately

---

## 6. PAYMENT & SUBSCRIPTIONS

### Stripe Integration
- [ ] **Stripe checkout loads**
  - Navigate to subscription page
  - Click subscribe button
  - Verify Stripe checkout opens

- [ ] **Test card works**
  - Use Stripe test card: 4242 4242 4242 4242
  - Complete checkout
  - Verify redirects back to app

- [ ] **Subscription status updates**
  - After successful payment
  - Check Firestore user document
  - Verify `subscriptionStatus: 'active'`
  - Verify `subscriptionTier` is set

- [ ] **Access grants correctly**
  - User with active subscription can access premium features
  - User without subscription sees upgrade prompts

- [ ] **Webhook handling**
  - Trigger subscription cancellation in Stripe
  - Verify webhook updates Firestore
  - Verify user loses premium access

### Affiliate Tracking
- [ ] **Affiliate links track clicks**
  - Click gear affiliate link
  - Verify click tracked in Firestore (if implemented)

- [ ] **Coach affiliate earnings display**
  - Navigate to coach analytics
  - Verify shows affiliate stats (if implemented)

---

## 7. DATA INTEGRITY

### Firestore Security Rules
- [ ] **Authenticated users cannot access other users' data**
  - Sign in as User A
  - Try to read User B's document via console
  - Verify permission denied

- [ ] **Coaches can only edit their own content**
  - Coach A cannot edit Coach B's lessons
  - Verify in Firestore console or via API

- [ ] **Athletes can only see their coach's content**
  - Athlete assigned to Coach A
  - Should not see Coach B's private lessons

- [ ] **Admins have elevated access**
  - Admin can read/write across collections
  - Verify via Firestore console

### Data Validation
- [ ] **Required fields enforced**
  - Try creating lesson without title
  - Try creating user without email
  - Verify validation errors

- [ ] **Email format validated**
  - Try invalid email formats
  - Verify rejected at API level

- [ ] **Role validation works**
  - Try setting invalid role
  - Verify only allowed roles accepted

### Relationships & References
- [ ] **Coach-Athlete relationship intact**
  - Athlete's `coachId` matches existing coach
  - Coach's athlete count matches actual athletes

- [ ] **Lesson-Creator relationship**
  - Every lesson has valid `creatorUid`
  - Creator exists in users collection

- [ ] **Orphaned data handling**
  - If coach deleted, athlete still functions
  - Graceful degradation (no crashes)

---

## 8. UI/UX CONSISTENCY

### Visual Consistency
- [ ] **Color palette is consistent**
  - Coach dashboard uses muted professional colors
  - Athlete dashboard matches
  - No bright teal/neon colors (recent fix)

- [ ] **Typography consistent**
  - Font sizes appropriate across pages
  - Headings use consistent hierarchy

- [ ] **Button styles consistent**
  - Primary buttons look the same everywhere
  - Hover states work
  - Disabled states clear

### Responsive Design
- [ ] **Mobile view works on all dashboards**
  - Test on iPhone/Android size (375px width)
  - Sidebar collapses correctly
  - Back button appears
  - Touch targets at least 44x44px

- [ ] **Tablet view works**
  - Test at 768px width
  - Verify sidebar and content layout

- [ ] **Desktop view optimal**
  - Test at 1920px width
  - Verify max-width constraints
  - No horizontal scroll

### Navigation
- [ ] **Sidebar navigation works consistently**
  - Click all items in coach sidebar
  - Click all items in athlete sidebar
  - Verify iframe/content loads correctly

- [ ] **Back button works**
  - Use browser back button
  - Verify correct page loads
  - Verify no broken states

- [ ] **Active states clear**
  - Current page highlighted
  - User knows where they are

### Loading States
- [ ] **Spinners show during loading**
  - Dashboard loads
  - Content fetches
  - No blank screens

- [ ] **Empty states informative**
  - No lessons: "Create your first lesson"
  - No athletes: "Invite athletes to get started"
  - Clear CTAs provided

### Error Handling
- [ ] **404 page exists**
  - Navigate to /nonexistent-page
  - Verify friendly 404 page

- [ ] **Error messages user-friendly**
  - Trigger auth error
  - Trigger network error
  - Verify messages are clear, not technical

- [ ] **Failed requests show feedback**
  - Disconnect internet
  - Try saving data
  - Verify error message appears

---

## 9. PERFORMANCE

### Page Load Times
- [ ] **Dashboard loads under 3 seconds**
  - Measure on decent connection
  - Use Network tab in DevTools

- [ ] **Lesson list loads quickly**
  - Even with 50+ lessons
  - Pagination or virtualization working

- [ ] **Images optimized**
  - Profile photos load quickly
  - Gear images don't block page
  - Use appropriate formats (WebP if possible)

### Real-time Updates
- [ ] **New announcement appears without refresh**
  - Have coach send announcement
  - Athlete dashboard updates automatically

- [ ] **Badge counts update in real-time**
  - New session request increments badge
  - No need to refresh

---

## 10. SECURITY BASICS

### Authentication
- [ ] **Cannot access dashboards when logged out**
  - Try navigating to /dashboard/athlete without auth
  - Verify redirect to login

- [ ] **Tokens expire correctly**
  - Wait for token timeout
  - Verify prompted to re-authenticate

- [ ] **Password reset works**
  - Request password reset
  - Verify email sent
  - Complete reset flow
  - Verify can sign in with new password

### XSS Protection
- [ ] **User input sanitized**
  - Try entering `<script>alert('XSS')</script>` in bio
  - Verify displayed as text, not executed

- [ ] **HTML in lesson descriptions handled**
  - Try adding malicious HTML
  - Verify sanitized/escaped

### API Security
- [ ] **API endpoints require authentication**
  - Call `/api/coach/lessons` without token
  - Verify 401 Unauthorized

- [ ] **Rate limiting in place (if implemented)**
  - Make 100 requests rapidly
  - Verify throttled or blocked

---

## 11. EDGE CASES

### Empty States
- [ ] **New coach with no content**
  - Fresh coach account
  - Verify empty states with helpful CTAs

- [ ] **Athlete with no coach**
  - Athlete skipped coach assignment
  - Verify app doesn't crash
  - Can still access content library

- [ ] **No announcements**
  - Verify empty state message
  - Not just blank screen

### Data Limits
- [ ] **Long lesson titles**
  - Create lesson with 200-character title
  - Verify truncates gracefully
  - No layout breaking

- [ ] **Many drills in one lesson**
  - Add 50+ drills
  - Verify UI handles it
  - Verify performance acceptable

- [ ] **Large athlete list**
  - Coach with 100+ athletes
  - Verify pagination works
  - Verify search/filter performs well

### Network Issues
- [ ] **Offline behavior**
  - Disconnect internet
  - Verify app shows offline indicator
  - Verify graceful degradation

- [ ] **Slow connection**
  - Throttle to 3G in DevTools
  - Verify loading states
  - Verify timeouts don't crash app

### Browser Compatibility
- [ ] **Chrome/Edge (latest)**
  - Full functionality works

- [ ] **Firefox (latest)**
  - Full functionality works

- [ ] **Safari (latest)**
  - Full functionality works
  - Verify iOS Safari on actual iPhone

- [ ] **Mobile browsers**
  - Chrome Mobile
  - Safari iOS
  - Verify touch interactions work

---

## 12. CRITICAL USER JOURNEYS

### Journey 1: Coach Onboards New Athlete
1. [ ] Coach signs in
2. [ ] Coach navigates to "Invite Athletes"
3. [ ] Coach copies invite code
4. [ ] New user signs up as athlete
5. [ ] Athlete enters coach's invite code
6. [ ] Athlete completes onboarding
7. [ ] Athlete appears in coach's "My Athletes" list
8. [ ] Coach can see athlete's email and name

### Journey 2: Coach Creates and Publishes Lesson
1. [ ] Coach navigates to "Create Lesson"
2. [ ] Coach enters title, description, sport
3. [ ] Coach adds 3 drills with descriptions
4. [ ] Coach embeds 2 YouTube videos
5. [ ] Coach clicks "Publish Lesson"
6. [ ] Success message appears
7. [ ] Lesson appears in coach's library
8. [ ] Athlete can see lesson in "My Lessons"
9. [ ] Athlete can view full lesson content

### Journey 3: Athlete Requests Live Session
1. [ ] Athlete signs in
2. [ ] Athlete clicks "Live 1-on-1 Session"
3. [ ] Modal opens with form
4. [ ] Athlete selects date preference
5. [ ] Athlete adds description of what to work on
6. [ ] Athlete submits request
7. [ ] Success message appears
8. [ ] Coach sees badge notification increase
9. [ ] Coach opens "Live 1-on-1 Sessions"
10. [ ] Coach sees athlete's request with details
11. [ ] Coach accepts request
12. [ ] Status updates in Firestore

### Journey 4: End-to-End Content Consumption
1. [ ] Athlete signs in
2. [ ] Athlete sees lessons from their coach
3. [ ] Athlete clicks on a lesson
4. [ ] Lesson content displays fully
5. [ ] Athlete watches embedded video
6. [ ] Athlete reads through drills
7. [ ] Athlete marks lesson complete
8. [ ] Completion saves to Firestore
9. [ ] Coach can see completion in analytics

### Journey 5: Gear Recommendation Flow
1. [ ] Coach navigates to "Gear Recommendations"
2. [ ] Coach adds new gear item
3. [ ] Coach fills in name, description, price, category
4. [ ] Coach adds affiliate link
5. [ ] Coach uploads image
6. [ ] Coach saves gear
7. [ ] Athlete navigates to "Gear Shop"
8. [ ] Athlete sees coach's gear with "Your Coach" badge
9. [ ] Athlete filters by category
10. [ ] Coach's gear appears in results
11. [ ] Athlete clicks "View & Buy"
12. [ ] Opens affiliate link in new tab

---

## 13. REGRESSION CHECKS (After Bug Fixes)

### Recent Color Fix
- [ ] **No bright teal colors anywhere**
  - Coach dashboard
  - Athlete dashboard
  - Gear shop
  - All use muted professional palette

- [ ] **Gradient banners use slate gray**
  - Not bright teal anymore

- [ ] **Icon backgrounds are muted**
  - Softer blues, teals, oranges, greens

### Recent Gear Shop Fix
- [ ] **Gear shop NOT nested when embedded**
  - Open gear shop from athlete dashboard
  - Verify clean single layout
  - No duplicate headers
  - White background, not beige

- [ ] **Gear shop standalone still works**
  - Navigate to /dashboard/gear directly
  - Verify AppHeader shows
  - Verify beige background
  - Verify title "Gear Shop" appears

---

## 14. DEPLOYMENT CHECKS (Production)

### Pre-Deployment
- [ ] **All environment variables set in production**
  - Firebase config
  - Stripe live keys (when ready)
  - API keys

- [ ] **Firestore rules deployed**
  - Run `firebase deploy --only firestore:rules`
  - Verify rules active in Firebase console

- [ ] **Build succeeds**
  - `npm run build` completes with 0 errors
  - No warnings about missing dependencies

### Post-Deployment
- [ ] **Production URL loads**
  - Visit deployed site
  - Homepage loads correctly

- [ ] **SSL certificate valid**
  - Check for HTTPS
  - No browser warnings

- [ ] **Sign in works in production**
  - Use real credentials
  - Verify authentication flow

- [ ] **Database connections work**
  - Data loads from production Firestore
  - Writes save correctly

- [ ] **Third-party integrations work**
  - Stripe checkout in live mode (when ready)
  - Video embeds load (Vimeo, YouTube)

- [ ] **Analytics tracking**
  - Verify Google Analytics fires (if implemented)
  - Page views tracked

---

## CRITICAL BLOCKERS (Must Fix Before MVP Launch)

These issues would prevent MVP launch:

- [ ] **Cannot sign in/sign up**
- [ ] **Coach cannot create lessons**
- [ ] **Athlete cannot view lessons**
- [ ] **Dashboards crash or infinite loop**
- [ ] **Data not saving to Firestore**
- [ ] **Major security vulnerability (open access to all data)**
- [ ] **Payment flow completely broken**
- [ ] **Site doesn't load on mobile**

---

## HIGH PRIORITY (Should Fix Before MVP)

These issues are important but not complete blockers:

- [ ] **Inconsistent UI/broken layouts on one dashboard**
- [ ] **One user role not working correctly**
- [ ] **Important feature (e.g., video review) not functioning**
- [ ] **Slow loading (>10 seconds for dashboard)**
- [ ] **Forms don't validate input**
- [ ] **Error messages confusing or missing**

---

## MEDIUM PRIORITY (Nice to Fix)

These can be addressed post-MVP:

- [ ] **Minor UI inconsistencies**
- [ ] **Non-critical features missing**
- [ ] **Analytics not tracking correctly**
- [ ] **Empty states could be more helpful**
- [ ] **Could use more loading spinners**

---

## TESTING TIPS

1. **Use Test Accounts**: Create dedicated test users:
   - `testcoach@example.com` (coach role)
   - `testathlete@example.com` (athlete role)
   - `testadmin@example.com` (admin role)

2. **Test in Order**: Follow user journeys sequentially to catch workflow issues

3. **Check Firestore After Actions**: Always verify data actually saved correctly

4. **Test Responsive**: Use DevTools device toolbar, don't just resize browser

5. **Clear Cache Between Tests**: Cmd/Ctrl + Shift + R for hard refresh

6. **Check Browser Console**: Always have DevTools open, watch for errors

7. **Test Edge Cases**: Empty states, max limits, special characters

8. **Document Issues**: Note exact steps to reproduce any bugs found

9. **Prioritize Critical Paths**: Test core flows first (auth, content creation, consumption)

10. **Test with Real Data**: Use realistic content length, actual images, varied data

---

## TEST STATUS TRACKING

### Overall Progress
- [ ] **Authentication & Onboarding** (0/XX completed)
- [ ] **Role-Based Access** (0/XX completed)
- [ ] **Coach Features** (0/XX completed)
- [ ] **Athlete Features** (0/XX completed)
- [ ] **Admin Features** (0/XX completed)
- [ ] **Payment & Subscriptions** (0/XX completed)
- [ ] **Data Integrity** (0/XX completed)
- [ ] **UI/UX Consistency** (0/XX completed)
- [ ] **Performance** (0/XX completed)
- [ ] **Security** (0/XX completed)
- [ ] **Edge Cases** (0/XX completed)
- [ ] **Critical Journeys** (0/XX completed)

### Sign-Off
- [ ] **All critical blockers resolved**
- [ ] **95%+ of test cases passing**
- [ ] **Core user journeys working end-to-end**
- [ ] **Ready for MVP launch** ✅

---

*Last Updated: 2025-10-14*
*Version: 1.0*
*Platform: GamePlan Sports Coaching Platform*
