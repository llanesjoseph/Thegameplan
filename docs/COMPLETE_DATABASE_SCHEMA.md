# Complete Database Schema - Production Ready

## 🎯 Overview

This document defines EVERY collection and subcollection needed for production, including:
- User management (5 roles)
- AI coach conversations & history
- Lesson tracking & analytics
- Payment & subscription history
- All data storage points

---

## 📚 Collection Index

```
Firestore Root
├── users/                          # MASTER - All users
├── athletes/                       # Athlete profiles + subcollections
├── coaches/                        # Coach profiles + subcollections
├── assistants/                     # Assistant coach profiles
├── admins/                         # Admin/Superadmin profiles
├── ai_sessions/                    # AI coach conversation sessions
├── ai_logs/                        # Individual AI interactions (privacy-focused)
├── content/                        # Lessons, videos, programs
├── lessonAnalytics/                # Lesson view/completion tracking
├── sessions/                       # Coaching sessions
├── invitations/                    # User invitations
├── notifications/                  # System notifications
├── payments/                       # Payment transactions
├── subscriptions/                  # User subscriptions
├── coach_applications/             # Coach application requests
├── feature_flags/                  # Platform feature toggles
└── savedResponses/                 # Saved AI responses for coaches
```

---

## 1️⃣ MASTER COLLECTION: users/

**Purpose:** Single source of truth for all user accounts

```typescript
users/{userId}/
{
  // Identity
  uid: string                       // Firebase Auth UID (matches document ID)
  email: string                     // User email
  displayName: string               // Full name
  photoURL: string?                 // Profile photo URL

  // Role & Access
  role: 'athlete' | 'coach' | 'assistant' | 'admin' | 'superadmin'  // ONE OF 5 ROLES

  // Status
  onboardingComplete: boolean       // Has completed onboarding
  emailVerified: boolean            // Email verified status
  accountStatus: 'active' | 'suspended' | 'deleted'  // Account state

  // Subscription (NEW - for payments)
  subscriptionTier: 'free' | 'basic' | 'pro' | 'elite'  // Current subscription level
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trial'  // Subscription state
  subscriptionId: string?           // Link to subscriptions/{subscriptionId}

  // Timestamps
  createdAt: timestamp              // Account creation
  updatedAt: timestamp              // Last profile update
  lastLoginAt: timestamp            // Last sign-in

  // Preferences (optional)
  preferredSports: string[]?        // Favorite sports
  skillLevel: string?               // Overall skill level
  timezone: string?                 // User timezone
  language: string?                 // Preferred language (default: 'en')
}
```

---

## 2️⃣ ATHLETES COLLECTION

**Purpose:** Athlete-specific data with cascading subcollections

```typescript
athletes/{athleteId}/               // athleteId = users/{userId}
{
  // Identity (mirrored from users/)
  uid: string                       // Same as users/{userId}
  email: string
  displayName: string

  // Athlete Details
  sport: string                     // Primary sport
  age: number?                      // Age (optional)
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  position: string?                 // Position/role in sport
  teamName: string?                 // Current team

  // Coaching
  coachId: string?                  // Reference to coaches/{coachId}
  coachName: string?                // Cache of coach name
  coachingSince: timestamp?         // When coaching relationship started

  // Goals
  primaryGoal: string?              // Main athletic goal
  targetCompetitionDate: timestamp? // Upcoming competition

  // Status
  onboardingComplete: boolean
  isActive: boolean                 // Currently training

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Athlete Subcollections

#### a) athleteProgress/

```typescript
athletes/{athleteId}/athleteProgress/{progressId}/
{
  // Stats
  totalSessions: number             // Completed sessions
  totalHours: number                // Total training hours
  currentStreak: number             // Days in a row
  longestStreak: number             // Best streak
  completedLessons: number          // Lessons finished

  // Achievements
  achievements: Array<{
    id: string
    title: string
    earnedAt: timestamp
    badgeUrl: string?
  }>

  // Performance Metrics
  skillProgress: {
    [skillName: string]: number     // 0-100 progress per skill
  }

  // Timestamps
  lastActivityAt: timestamp
  updatedAt: timestamp
}
```

#### b) athleteNotifications/

```typescript
athletes/{athleteId}/athleteNotifications/{notificationId}/
{
  // Content
  type: 'session' | 'achievement' | 'message' | 'reminder' | 'system'
  title: string
  message: string
  actionUrl: string?                // Link to act on notification

  // Status
  read: boolean
  dismissed: boolean

  // Metadata
  priority: 'low' | 'medium' | 'high'
  expiresAt: timestamp?             // Auto-delete after this date

  // Timestamps
  createdAt: timestamp
  readAt: timestamp?
}
```

#### c) athleteSessions/

```typescript
athletes/{athleteId}/athleteSessions/{sessionId}/
{
  // Session Info
  coachId: string                   // Reference to coaches/{coachId}
  coachName: string                 // Cache of coach name
  sessionType: 'one-on-one' | 'group' | 'video-review' | 'ai-coaching'

  // Scheduling
  scheduledAt: timestamp            // When session scheduled for
  duration: number                  // Minutes
  location: string?                 // Physical or virtual location

  // Status
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  completedAt: timestamp?
  cancelledAt: timestamp?
  cancelReason: string?

  // Notes
  preSessionNotes: string?          // Athlete notes before
  postSessionNotes: string?         // Coach feedback after
  rating: number?                   // 1-5 star rating

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### d) athleteGoals/

```typescript
athletes/{athleteId}/athleteGoals/{goalId}/
{
  // Goal Details
  title: string
  description: string
  category: 'skill' | 'fitness' | 'competition' | 'mental' | 'other'

  // Progress
  targetDate: timestamp?
  status: 'active' | 'completed' | 'abandoned' | 'paused'
  progress: number                  // 0-100

  // Milestones
  milestones: Array<{
    title: string
    completed: boolean
    completedAt: timestamp?
  }>

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  completedAt: timestamp?
}
```

#### e) athleteLessonHistory/ (NEW)

```typescript
athletes/{athleteId}/athleteLessonHistory/{historyId}/
{
  // Lesson Info
  lessonId: string                  // Reference to content/{lessonId}
  lessonTitle: string               // Cache
  coachId: string                   // Who created it
  coachName: string                 // Cache

  // Viewing
  firstViewedAt: timestamp
  lastViewedAt: timestamp
  totalViews: number
  totalWatchTime: number            // Seconds
  completionPercentage: number      // 0-100

  // Status
  completed: boolean
  completedAt: timestamp?
  bookmarked: boolean
  rating: number?                   // 1-5 stars

  // Notes
  personalNotes: string?            // Athlete's notes on lesson

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 3️⃣ COACHES COLLECTION

**Purpose:** Coach profiles and their content

```typescript
coaches/{coachId}/                  // coachId = users/{userId}
{
  // Identity
  uid: string
  email: string
  displayName: string

  // Profile
  slug: string                      // URL-friendly name
  sport: string                     // Primary sport
  bio: string                       // Coach bio
  tagline: string?                  // Short description

  // Credentials
  certifications: string[]          // Coaching certifications
  specialties: string[]             // Areas of expertise
  experience: string                // Years/background
  headshotUrl: string?              // Profile photo
  heroImageUrl: string?             // Banner image

  // Verification
  verified: boolean                 // Admin verified
  status: 'pending' | 'approved' | 'suspended'
  isActive: boolean
  featured: boolean                 // Featured coach

  // Social Links
  socialLinks: {
    website: string?
    instagram: string?
    youtube: string?
    tiktok: string?
    twitter: string?
    linkedin: string?
  }

  // Stats
  stats: {
    totalAthletes: number
    totalContent: number
    avgRating: number
    totalReviews: number
    totalLessons: number
    totalRevenue: number            // Lifetime earnings
  }

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  approvedAt: timestamp?
  approvedBy: string?               // Admin who approved
}
```

### Coach Subcollections

#### a) coachAthletes/

```typescript
coaches/{coachId}/coachAthletes/{athleteId}/
{
  // Athlete Info
  athleteId: string                 // Reference
  displayName: string               // Cache
  email: string                     // Cache
  sport: string
  skillLevel: string

  // Relationship
  status: 'active' | 'inactive' | 'completed'
  startedAt: timestamp
  endedAt: timestamp?

  // Progress
  totalSessions: number
  lastSessionAt: timestamp?

  // Notes
  coachNotes: string?               // Private coach notes
  goals: string?                    // Athlete goals

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### b) coachContent/

```typescript
coaches/{coachId}/coachContent/{contentId}/
{
  // Content Info
  title: string
  description: string
  type: 'video' | 'lesson' | 'program' | 'drill' | 'guide'

  // Media
  videoUrl: string?
  thumbnailUrl: string?
  duration: number?                 // Seconds (for videos)
  attachments: string[]?            // URLs to PDFs, images, etc.

  // Organization
  sport: string
  category: string
  tags: string[]
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all'

  // Visibility
  published: boolean
  visibility: 'public' | 'private' | 'athletes-only'
  requiresSubscription: boolean
  subscriptionTier: 'free' | 'basic' | 'pro' | 'elite'

  // Analytics
  views: number
  likes: number
  completions: number
  avgRating: number

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  publishedAt: timestamp?
}
```

#### c) coachRevenue/ (NEW)

```typescript
coaches/{coachId}/coachRevenue/{revenueId}/
{
  // Transaction
  amount: number                    // USD cents
  currency: string                  // 'usd'
  type: 'lesson_purchase' | 'subscription' | 'session' | 'tip'

  // Source
  athleteId: string?                // Who paid
  athleteName: string?              // Cache
  contentId: string?                // If lesson purchase
  sessionId: string?                // If session payment

  // Payment
  paymentId: string                 // Reference to payments/{paymentId}
  paymentMethod: 'card' | 'paypal' | 'other'

  // Payout
  payoutStatus: 'pending' | 'processing' | 'paid' | 'failed'
  payoutDate: timestamp?
  payoutId: string?

  // Timestamps
  createdAt: timestamp
}
```

---

## 4️⃣ AI COACH CONVERSATIONS

**Purpose:** Store AI coaching interactions for history and billing

### a) ai_sessions/

```typescript
ai_sessions/{sessionId}/
{
  // User Info
  userId: string                    // Reference to users/{userId}
  userEmail: string                 // Cache
  userRole: 'athlete' | 'coach' | ...  // Cache

  // Session Info
  sessionId: string                 // Unique session ID
  startTime: timestamp
  endTime: timestamp?

  // Usage
  totalQuestions: number
  totalTokensUsed: number
  totalCost: number                 // USD cents

  // Subscription
  userSubscriptionLevel: 'free' | 'basic' | 'pro' | 'elite'

  // Legal Compliance
  disclaimerAccepted: boolean
  consentTimestamp: timestamp
  termsVersion: string
  privacyPolicyVersion: string

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### b) ai_logs/

```typescript
ai_logs/{logId}/
{
  // User
  userId: string
  userEmail: string
  sessionId: string                 // Link to ai_sessions/{sessionId}

  // Request
  question: string                  // Original question
  questionHash: string              // SHA-256 hash for privacy
  sport: string?
  coachContext: string?

  // Response
  aiResponse: string                // AI answer
  responseHash: string              // SHA-256 hash
  provider: 'openai' | 'anthropic' | 'google'
  providerModel: string
  responseLength: number

  // Performance
  providerLatencyMs: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  usedCache: boolean

  // Safety
  contentFlags: string[]            // ['injury_related', 'medical_advice', etc.]
  riskLevel: 'low' | 'medium' | 'high'
  reviewRequired: boolean

  // Legal
  disclaimerShown: boolean
  userConsent: boolean
  termsVersion: string

  // Metadata
  ipAddress: string?
  userAgent: string?

  // Timestamp
  timestamp: timestamp
}
```

### c) ai_conversations/ (NEW - User-Facing)

```typescript
ai_conversations/{conversationId}/
{
  // Owner
  userId: string                    // Athlete who owns this conversation
  userName: string                  // Cache

  // Conversation
  title: string                     // Auto-generated from first question
  sessionId: string                 // Link to ai_sessions/

  // Messages
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: timestamp
  }>

  // Status
  archived: boolean
  bookmarked: boolean

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  lastMessageAt: timestamp
}
```

---

## 5️⃣ CONTENT & LESSONS

```typescript
content/{contentId}/
{
  // Owner
  coachId: string                   // Creator
  coachName: string                 // Cache
  coachSlug: string                 // Cache

  // Content
  title: string
  description: string
  type: 'video' | 'lesson' | 'program' | 'drill'
  sport: string

  // Media
  videoUrl: string?
  thumbnailUrl: string?
  duration: number?                 // Seconds

  // Access
  published: boolean
  visibility: 'public' | 'private' | 'athletes-only'
  requiresSubscription: boolean
  subscriptionTier: 'free' | 'basic' | 'pro' | 'elite'
  price: number?                    // USD cents (if pay-per-view)

  // Analytics
  views: number
  likes: number
  shares: number
  completions: number
  avgRating: number
  totalRatings: number

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  publishedAt: timestamp?
}
```

---

## 6️⃣ LESSON ANALYTICS

```typescript
lessonAnalytics/{analyticsId}/
{
  // Lesson
  lessonId: string                  // Reference to content/{lessonId}
  lessonTitle: string               // Cache
  coachId: string

  // Viewer
  viewerId: string                  // User who viewed
  viewerEmail: string               // Cache
  viewerRole: string                // Cache

  // View Data
  viewStartTime: timestamp
  viewEndTime: timestamp?
  watchDuration: number             // Seconds actually watched
  completionPercentage: number      // 0-100
  completed: boolean

  // Engagement
  liked: boolean
  bookmarked: boolean
  shared: boolean
  rating: number?                   // 1-5 stars

  // Device
  device: 'mobile' | 'tablet' | 'desktop'
  browser: string?

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 7️⃣ PAYMENTS & SUBSCRIPTIONS

### a) payments/

```typescript
payments/{paymentId}/
{
  // Transaction
  amount: number                    // USD cents
  currency: string                  // 'usd'
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'

  // Payer
  userId: string                    // Who paid
  userName: string                  // Cache
  userEmail: string                 // Cache

  // Recipient
  recipientId: string?              // Coach who receives money
  recipientName: string?            // Cache

  // Type
  paymentType: 'subscription' | 'lesson_purchase' | 'session' | 'tip'
  relatedId: string?                // ID of subscription/lesson/session

  // Payment Method
  paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
  last4: string?                    // Last 4 digits of card
  brand: string?                    // 'visa', 'mastercard', etc.

  // Processing
  stripePaymentIntentId: string?    // Stripe integration
  stripeChargeId: string?

  // Platform Fee
  platformFee: number               // Platform cut (USD cents)
  coachPayout: number               // What coach receives

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  succeededAt: timestamp?
  refundedAt: timestamp?
}
```

### b) subscriptions/

```typescript
subscriptions/{subscriptionId}/
{
  // Subscriber
  userId: string                    // User with subscription
  userName: string                  // Cache
  userEmail: string                 // Cache

  // Plan
  tier: 'basic' | 'pro' | 'elite'
  price: number                     // USD cents/month
  interval: 'month' | 'year'

  // Status
  status: 'active' | 'cancelled' | 'past_due' | 'trial' | 'expired'
  cancelAtPeriodEnd: boolean

  // Billing
  currentPeriodStart: timestamp
  currentPeriodEnd: timestamp
  trialEnd: timestamp?

  // Payment
  paymentMethodId: string?
  last4: string?
  brand: string?

  // Stripe Integration
  stripeSubscriptionId: string?
  stripeCustomerId: string?

  // Features
  features: {
    aiMessagesPerMonth: number      // AI coach message limit
    videoStorage: number             // GB of video storage
    athleteSlots: number             // Max athletes (for coaches)
    prioritySupport: boolean
  }

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  cancelledAt: timestamp?
  endedAt: timestamp?
}
```

### c) subscriptionHistory/ (NEW)

```typescript
subscriptionHistory/{historyId}/
{
  // Reference
  subscriptionId: string            // Link to subscriptions/
  userId: string

  // Event
  eventType: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed' | 'payment_failed'
  fromTier: string?
  toTier: string?

  // Details
  amount: number?                   // If payment
  paymentId: string?                // Reference to payments/
  reason: string?                   // Cancellation reason, etc.

  // Timestamp
  occurredAt: timestamp
}
```

---

## 8️⃣ OTHER COLLECTIONS

### a) sessions/

```typescript
sessions/{sessionId}/
{
  // Participants
  coachId: string
  coachName: string
  athleteId: string
  athleteName: string

  // Session
  sessionType: 'one-on-one' | 'group' | 'video-review'
  scheduledAt: timestamp
  duration: number                  // Minutes
  location: string?

  // Status
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled'
  completedAt: timestamp?

  // Payment
  price: number?                    // USD cents
  paymentId: string?                // Reference to payments/
  paymentStatus: 'pending' | 'paid' | 'refunded'

  // Notes
  preSessionNotes: string?
  postSessionNotes: string?
  rating: number?

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### b) invitations/

```typescript
invitations/{invitationId}/
{
  // Inviter
  inviterId: string                 // Who sent invite
  inviterName: string
  inviterRole: string

  // Invitee
  inviteeEmail: string              // Who is invited
  inviteeName: string?
  assignedRole: 'athlete' | 'coach' | 'assistant' | 'admin'

  // Status
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  used: boolean

  // Code
  invitationCode: string            // Unique code
  expiresAt: timestamp

  // Additional Data
  coachId: string?                  // If athlete invitation
  sport: string?
  message: string?

  // Timestamps
  createdAt: timestamp
  acceptedAt: timestamp?
}
```

### c) notifications/

```typescript
notifications/{notificationId}/
{
  // Recipient
  userId: string
  userEmail: string

  // Content
  type: 'session' | 'message' | 'achievement' | 'payment' | 'system'
  title: string
  message: string
  actionUrl: string?

  // Status
  read: boolean
  dismissed: boolean

  // Priority
  priority: 'low' | 'medium' | 'high' | 'urgent'

  // Timestamps
  createdAt: timestamp
  readAt: timestamp?
  expiresAt: timestamp?
}
```

### d) assistants/

```typescript
assistants/{assistantId}/
{
  // Identity
  uid: string
  email: string
  displayName: string

  // Assignment
  coachId: string                   // Coach they assist
  coachName: string                 // Cache

  // Permissions
  permissions: Array<'view_athletes' | 'create_content' | 'schedule_sessions' | 'send_messages'>

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### e) admins/

```typescript
admins/{adminId}/
{
  // Identity
  uid: string
  email: string
  displayName: string
  role: 'admin' | 'superadmin'

  // Permissions
  permissions: Array<'manage_users' | 'manage_content' | 'manage_coaches' | 'view_analytics' | 'manage_payments'>

  // Activity
  lastActivity: timestamp
  actionsCount: number

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### f) coach_applications/

```typescript
coach_applications/{applicationId}/
{
  // Applicant
  userId: string
  email: string
  displayName: string

  // Application
  sport: string
  bio: string
  experience: string
  certifications: string[]
  socialLinks: object

  // Status
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string?               // Admin who reviewed
  reviewNotes: string?

  // Timestamps
  submittedAt: timestamp
  reviewedAt: timestamp?
}
```

### g) feature_flags/

```typescript
feature_flags/{featureId}/
{
  // Feature
  name: string
  description: string
  enabled: boolean

  // Rollout
  rolloutPercentage: number         // 0-100
  allowedRoles: string[]            // Which roles can access
  allowedUsers: string[]?           // Specific user IDs

  // Metadata
  createdBy: string
  updatedBy: string

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### h) savedResponses/

```typescript
savedResponses/{responseId}/
{
  // Owner
  coachId: string                   // Coach who saved this

  // Response
  title: string                     // Name for this saved response
  content: string                   // The actual response text
  category: string                  // 'injury', 'technique', 'motivation', etc.
  sport: string

  // Usage
  timesUsed: number
  lastUsedAt: timestamp?

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 🔄 User Creation Flow (Complete)

### New Athlete Signs Up

```
1. Firebase Auth creates account → uid
2. Create users/{uid}
   - role: 'athlete'
   - subscriptionTier: 'free'
   - subscriptionStatus: 'active'
3. Create athletes/{uid}
   - sport, skillLevel, etc.
4. Create empty subcollections:
   - athleteProgress/{uid}/initial
   - athleteNotifications/ (empty)
   - athleteSessions/ (empty)
   - athleteGoals/ (empty)
   - athleteLessonHistory/ (empty)
5. Create subscription (free tier)
   - subscriptions/{subId}
   - Link to users/{uid}.subscriptionId
6. Redirect to /dashboard/progress
```

### New Coach Approved

```
1. Admin approves coach_applications/{appId}
2. Update users/{uid}
   - role: 'coach'
3. Create coaches/{uid}
   - bio, sport, certifications, etc.
   - status: 'approved'
4. Create empty subcollections:
   - coachAthletes/ (empty)
   - coachContent/ (empty)
   - coachRevenue/ (empty)
5. Redirect to /dashboard/creator
```

---

## 💳 Payment Flow

### User Subscribes

```
1. User selects subscription tier
2. Create payment intent (Stripe)
3. On success:
   - Create payments/{paymentId}
   - Create subscriptions/{subId}
   - Update users/{uid}.subscriptionId
   - Update users/{uid}.subscriptionTier
   - Create subscriptionHistory/{historyId}
     - eventType: 'created'
4. Grant subscription features
```

### Coach Receives Payout

```
1. Payment occurs → payments/{paymentId}
2. Calculate platform fee (e.g., 15%)
3. Create coachRevenue/{revenueId}
   - amount: coachPayout
   - payoutStatus: 'pending'
4. Monthly payout process:
   - Aggregate all pending revenue
   - Process payout to coach bank account
   - Update payoutStatus: 'paid'
   - Update payoutDate
```

---

## 📊 Summary

**Total Collections:** 18
**Total Subcollections:** 9

**Collections:**
1. users (master)
2. athletes
3. coaches
4. assistants
5. admins
6. ai_sessions
7. ai_logs
8. ai_conversations (NEW)
9. content
10. lessonAnalytics
11. payments (NEW)
12. subscriptions (NEW)
13. subscriptionHistory (NEW)
14. sessions
15. invitations
16. notifications
17. coach_applications
18. feature_flags
19. savedResponses

**Subcollections:**
- athleteProgress
- athleteNotifications
- athleteSessions
- athleteGoals
- athleteLessonHistory (NEW)
- coachAthletes
- coachContent
- coachRevenue (NEW)

---

## ✅ Production Readiness Checklist

### Data Storage
- [x] User management (5 roles)
- [x] Athlete profiles with cascading data
- [x] Coach profiles with content
- [x] AI conversation history
- [x] Lesson tracking & analytics
- [x] Payment transaction history
- [x] Subscription management
- [x] Session scheduling
- [x] Notifications system

### Missing Before Launch
- [ ] Implement payment processing (Stripe)
- [ ] Create subscription plans in Stripe
- [ ] Set up payout schedules for coaches
- [ ] Implement AI usage limits per tier
- [ ] Create billing dashboard for users
- [ ] Set up payment webhooks

---

**This schema is now COMPLETE for production launch!** 🚀
