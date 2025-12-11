# 🗄️ Complete Game Plan Database Schema & Data Points

## 📊 **Firestore Collections Overview**

### **Core Collections (Required)**
1. **`users`** - User accounts and authentication data
2. **`profiles`** - Extended user profile information  
3. **`contributorApplications`** - Creator application submissions
4. **`creatorPublic`** - Public creator profiles for discovery
5. **`creator_profiles`** - Private creator profile data
6. **`content`** - Lessons, courses, and educational content
7. **`coaching_requests`** - User-to-creator coaching requests
8. **`events`** - Scheduled coaching sessions and events
9. **`notifications`** - User notification system
10. **`ai_interaction_logs`** - AI coaching session logs
11. **`ai_sessions`** - AI session management
12. **`ai_content_flags`** - AI content moderation flags
13. **`disclaimer_acceptances`** - Legal disclaimer tracking
14. **`gear`** - Equipment and gear management
15. **`progress`** - User learning progress tracking
16. **`availability`** - Creator availability schedules
17. **`sessions`** - Coaching session management
18. **`requests`** - General user requests
19. **`admin`** - Administrative settings and configurations

### **Analytics Collections (Optional but Recommended)**
20. **`creatorAnalytics`** - Creator performance metrics
21. **`lessonAnalytics`** - Individual lesson performance
22. **`userAnalytics`** - User engagement metrics
23. **`systemAnalytics`** - Platform-wide metrics

---

## 🔧 **Collection Details & Data Points**

### **1. `users` Collection**
**Purpose**: Core user authentication and role management
**Document ID**: User UID

```typescript
{
  uid: string                    // Firebase Auth UID
  email: string                  // User email address
  displayName?: string           // User display name
  firstName?: string             // User first name
  lastName?: string              // User last name
  role: 'guest' | 'user' | 'creator' | 'admin' | 'superadmin'
  createdAt: Timestamp           // Account creation date
  lastLoginAt?: Timestamp        // Last login timestamp
  lastActive?: Timestamp         // Last activity timestamp
  lastUpdatedAt?: Timestamp      // Last profile update
  
  // Role-specific fields
  creatorStatus?: 'not-applied' | 'pending' | 'approved' | 'rejected' | 'suspended'
  applicationRef?: string        // Reference to contributorApplications document
  
  // Permissions (for admins/superadmins)
  permissions?: {
    canCreateContent: boolean
    canManageContent: boolean
    canAccessAnalytics: boolean
    canReceivePayments: boolean
    canSwitchRoles?: boolean     // Superadmin only
    canManageUsers?: boolean     // Admin/Superadmin only
  }
  
  // Subscription data
  subscriptionPlan?: 'free' | 'basic' | 'pro' | 'elite'
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due'
  stripeCustomerId?: string
  
  // Onboarding
  onboardingCompleted?: boolean
  
  // Profile preferences
  sport?: string                 // Primary sport
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  goals?: string[]               // User goals
}
```

### **2. `profiles` Collection**
**Purpose**: Extended user profile information
**Document ID**: User UID (matches users collection)

```typescript
{
  uid: string                    // User UID
  firstName: string              // User first name
  lastName: string               // User last name
  email: string                  // User email
  bio?: string                   // User biography
  expertise?: string[]           // Areas of expertise
  sports: string[]               // Sports user participates in
  certifications?: string[]      // Professional certifications
  goals?: string[]               // Learning goals
  achievements?: string[]        // Notable achievements
  
  // Profile settings
  isPublic: boolean              // Whether profile is publicly visible
  role: UserRole                 // Current user role
  
  // Timestamps
  createdAt: Timestamp           // Profile creation date
  updatedAt: Timestamp           // Last update timestamp
  
  // Social links (for creators)
  socialLinks?: {
    instagram?: string
    youtube?: string
    tiktok?: string
    website?: string
    twitter?: string
    linkedin?: string
  }
  
  // Creator-specific fields
  slug?: string                  // URL-friendly name for creators
  profileImageUrl?: string       // Profile picture URL
  actionImageUrl?: string        // Action shot URL
  tagline?: string               // Creator tagline
  verified?: boolean             // Verification status
  featured?: boolean             // Featured creator status
  
  // Creator stats (calculated)
  stats?: {
    totalStudents?: number
    totalContent?: number
    avgRating?: number
    totalReviews?: number
    earningsTotal?: number
    earningsThisMonth?: number
    earningsPending?: number
  }
}
```

### **3. `contributorApplications` Collection**
**Purpose**: Creator application submissions and review process
**Document ID**: Auto-generated

```typescript
{
  // Personal Information
  firstName: string              // Applicant first name
  lastName: string               // Applicant last name
  email: string                  // Applicant email
  
  // Application Details
  primarySport: string           // Primary sport focus
  experience: 'college' | 'pro' | 'olympic' | 'coach' | 'analyst' | 'other'
  experienceDetails: string      // Detailed experience description
  
  // Content Focus
  specialties: string[]          // Areas of specialization
  contentTypes: string[]         // Types of content to create
  targetAudience: string[]       // Target audience
  contentDescription: string     // Content vision description
  
  // Credentials
  achievements: string[]         // Notable achievements
  certifications: string[]       // Professional certifications
  
  // Application Status
  status: 'pending' | 'approved' | 'rejected'
  userId: string                 // Applicant's UID
  userEmail: string              // Applicant's email
  
  // Review Process
  submittedAt: Timestamp         // Application submission date
  reviewedAt?: Timestamp         // Review completion date
  reviewerId?: string            // Admin who reviewed
  reviewerNotes?: string         // Review comments
  
  // Auto-approval flags
  autoApproved?: boolean         // Whether auto-approved
  reviewerNotes?: string         // Admin review notes
}
```

### **4. `creatorPublic` Collection**
**Purpose**: Public creator profiles for discovery and browsing
**Document ID**: Creator slug (e.g., "jasmine-aikey")

```typescript
{
  name: string                   // Creator display name
  firstName: string              // First name
  sport: string                  // Primary sport
  tagline: string                // Creator tagline
  heroImageUrl?: string          // Hero/cover image
  headshotUrl?: string           // Profile headshot
  
  // Credentials
  badges: string[]               // Notable achievements/badges
  specialties: string[]          // Areas of expertise
  experience: string             // Experience level
  verified: boolean              // Verification status
  featured: boolean              // Featured creator status
  
  // Content stats
  lessonCount: number            // Number of lessons created
  
  // Links
  slug: string                   // URL-friendly identifier
  profileUrl?: string            // Full profile URL
}
```

### **5. `creator_profiles` Collection**
**Purpose**: Private creator profile data and business information
**Document ID**: Creator UID

```typescript
{
  uid: string                    // Creator UID
  email: string                  // Creator email
  role: 'creator'                // User role
  status: 'active' | 'suspended' | 'inactive'
  name: string                   // Display name
  firstName: string              // First name
  
  // Profile data
  sport: string                  // Primary sport
  tagline: string                // Creator tagline
  verified: boolean              // Verification status
  featured: boolean              // Featured status
  
  // Business data
  stripeAccountId?: string       // Stripe Connect account ID
  earningsTotal: number          // Total earnings
  earningsThisMonth: number      // Current month earnings
  earningsPending: number        // Pending earnings
  
  // Performance metrics
  totalStudents?: number         // Number of students
  totalContent?: number          // Number of content pieces
  avgRating?: number             // Average rating
  totalReviews?: number          // Number of reviews
  
  // Settings
  isActive: boolean              // Profile active status
  createdAt: Timestamp           // Profile creation date
  updatedAt: Timestamp           // Last update date
}
```

### **6. `content` Collection**
**Purpose**: Lessons, courses, and educational content
**Document ID**: Content ID (e.g., "lesson-soccer-001")

```typescript
{
  id: string                     // Unique content identifier
  title: string                  // Content title
  description: string            // Content description
  creatorId: string              // Creator UID
  creatorName: string            // Creator display name
  creatorUid: string             // Creator UID (alternative field)
  
  // Content Classification
  sport: string                  // Sport category
  category: 'technical' | 'tactical' | 'mental' | 'physical' | 'nutrition' | 'recovery'
  type: 'video' | 'article' | 'lesson' | 'drill' | 'course'
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  
  // Content Details
  duration: number               // Duration in seconds
  price: number                  // Price in USD
  tags: string[]                 // Content tags
  
  // Media
  videoUrl?: string              // Video file URL
  thumbnailUrl?: string          // Thumbnail image URL
  
  // Status and Publishing
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Timestamp        // Publication date
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update date
  
  // Subscription Requirements
  requiredTier?: 'free' | 'basic' | 'pro' | 'elite'
  
  // Performance Metrics
  viewCount?: number             // Number of views
  rating?: number                // Average rating
  reviewCount?: number           // Number of reviews
  
  // SEO and Discovery
  slug?: string                  // URL-friendly identifier
  seoTitle?: string              // SEO optimized title
  seoDescription?: string        // SEO description
  
  // Content Management
  isFeatured?: boolean           // Featured content flag
  isPremium?: boolean            // Premium content flag
  sortOrder?: number             // Display order
}
```

### **7. `coaching_requests` Collection**
**Purpose**: User-to-creator coaching requests and interactions
**Document ID**: Auto-generated

```typescript
{
  // Request Information
  userId: string                 // Requesting user UID
  userName: string               // Requesting user name
  userEmail: string              // Requesting user email
  
  // Target Creator
  creatorId: string              // Target creator UID
  creatorName: string            // Target creator name
  targetCreatorUid: string       // Alternative creator UID field
  
  // Request Details
  message: string                // Request message
  status: 'pending' | 'accepted' | 'completed' | 'declined' | 'responded'
  sport: string                  // Sport category
  category: string               // Request category
  
  // Request Type
  requestType?: 'video_review' | 'technique_help' | 'training_plan' | 'general'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  
  // Response Data
  response?: string              // Creator response
  respondedAt?: Timestamp        // Response timestamp
  
  // File Attachments
  fileUrls?: string[]            // Attached file URLs
  
  // Scheduling
  dueDate?: Timestamp            // Request due date
  
  // Timestamps
  createdAt: Timestamp           // Request creation date
  updatedAt: Timestamp           // Last update date
}
```

### **8. `events` Collection**
**Purpose**: Scheduled coaching sessions and events
**Document ID**: Auto-generated

```typescript
{
  // Event Information
  title: string                  // Event title
  description: string            // Event description
  creatorUid: string             // Creator UID
  creatorId: string              // Alternative creator ID field
  
  // Scheduling
  startTime: Timestamp           // Event start time
  endTime: Timestamp             // Event end time
  duration: number               // Duration in minutes
  
  // Event Details
  type: 'coaching' | 'workshop' | 'seminar' | 'group-session'
  sport: string                  // Sport category
  level: string                  // Skill level
  maxParticipants?: number       // Maximum participants
  
  // Location/Meeting
  location?: string              // Physical location
  meetingLink?: string           // Online meeting link
  isOnline: boolean              // Online event flag
  
  // Status
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  
  // Participants
  participants?: string[]        // Participant UIDs
  participantCount?: number      // Number of participants
  
  // Pricing
  price?: number                 // Event price
  isFree: boolean                // Free event flag
  
  // Timestamps
  createdAt: Timestamp           // Event creation date
  updatedAt: Timestamp           // Last update date
}
```

### **9. `notifications` Collection**
**Purpose**: User notification system (subcollections)
**Document ID**: User UID
**Subcollection**: `messages`

```typescript
// Subcollection: notifications/{userId}/messages
{
  id: string                     // Notification ID
  type: 'info' | 'success' | 'warning' | 'error' | 'coaching_response' | 'application_update'
  title: string                  // Notification title
  message: string                // Notification message
  
  // Action
  actionUrl?: string             // URL to navigate to
  actionText?: string            // Action button text
  
  // Status
  isRead: boolean                // Read status
  isArchived: boolean            // Archived status
  
  // Metadata
  relatedId?: string             // Related entity ID (request, application, etc.)
  relatedType?: string           // Type of related entity
  
  // Timestamps
  createdAt: Timestamp           // Notification creation date
  expiresAt?: Timestamp          // Notification expiration
  readAt?: Timestamp             // Read timestamp
}
```

### **10. `ai_interaction_logs` Collection**
**Purpose**: AI coaching session logs and analytics
**Document ID**: Auto-generated

```typescript
{
  // Session Information
  id?: string                    // Log entry ID
  userId: string                 // User UID
  userEmail: string              // User email
  sessionId: string              // Session identifier
  timestamp: Timestamp           // Interaction timestamp
  
  // Request Data
  question: string               // User question
  questionHash: string           // SHA-256 hash for privacy
  sport?: string                 // Sport context
  coachContext?: string          // Coach context
  
  // Response Data
  aiResponse: string             // AI response
  responseHash: string           // SHA-256 hash for privacy
  provider: 'vertex' | 'openai' | 'gemini' | 'fallback' | 'emergency' | 'safety_system'
  responseLength: number         // Response length
  providerModel?: string         // AI model used
  providerLatencyMs?: number     // Response latency
  
  // Token Usage
  promptTokens?: number          // Input tokens
  completionTokens?: number      // Output tokens
  totalTokens?: number           // Total tokens
  usedCache?: boolean            // Cache usage flag
  
  // Metadata
  ipAddress?: string             // User IP address
  userAgent?: string             // User agent string
  location?: string              // Geographic location
  
  // Legal/Safety
  contentFlags?: string[]        // Content warning flags
  riskLevel: 'low' | 'medium' | 'high'
  reviewRequired: boolean        // Manual review flag
  
  // Compliance
  disclaimerShown: boolean       // Disclaimer shown flag
  userConsent: boolean           // User consent flag
  termsVersion: string           // Terms version accepted
}
```

### **11. `ai_sessions` Collection**
**Purpose**: AI session management and tracking
**Document ID**: Auto-generated

```typescript
{
  id?: string                    // Session ID
  userId: string                 // User UID
  userEmail: string              // User email
  sessionId: string              // Unique session identifier
  
  // Session Timing
  startTime: Timestamp           // Session start
  endTime?: Timestamp            // Session end
  
  // Usage Statistics
  totalQuestions: number         // Questions asked
  totalTokensUsed?: number       // Total tokens consumed
  userSubscriptionLevel: 'free' | 'basic' | 'pro' | 'elite'
  
  // Legal Compliance
  disclaimerAccepted: boolean    // Disclaimer acceptance
  termsVersion: string           // Terms version
  privacyPolicyVersion: string   // Privacy policy version
}
```

### **12. `ai_content_flags` Collection**
**Purpose**: AI content moderation and safety flags
**Document ID**: Auto-generated

```typescript
{
  sessionId: string              // Related session ID
  userId: string                 // User UID
  flagType: string               // Type of flag
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string            // Flag description
  
  // Content Details
  flaggedContent: string         // Flagged content text
  context?: string               // Additional context
  
  // Resolution
  reviewed: boolean              // Manual review status
  resolved: boolean              // Resolution status
  reviewerId?: string            // Reviewer UID
  resolution?: string            // Resolution notes
  
  // Timestamps
  createdAt: Timestamp           // Flag creation date
  reviewedAt?: Timestamp         // Review date
  resolvedAt?: Timestamp         // Resolution date
}
```

### **13. `disclaimer_acceptances` Collection**
**Purpose**: Legal disclaimer tracking and compliance
**Document ID**: User UID

```typescript
{
  userId: string                 // User UID
  aiCoachingDisclaimer: boolean  // AI coaching disclaimer
  medicalDisclaimer: boolean     // Medical disclaimer
  liabilityDisclaimer: boolean   // Liability disclaimer
  
  // Version Tracking
  termsVersion: string           // Terms of service version
  privacyVersion: string         // Privacy policy version
  disclaimerVersion: string      // Disclaimer version
  
  // Timestamps
  acceptedAt: Timestamp          // Acceptance timestamp
  lastUpdatedAt: Timestamp       // Last update timestamp
}
```

### **14. `gear` Collection**
**Purpose**: Equipment and gear management
**Document ID**: Auto-generated

```typescript
{
  // Gear Information
  name: string                   // Gear name
  description: string            // Gear description
  sport: string                  // Sport category
  category: string               // Gear category
  
  // Details
  brand?: string                 // Brand name
  model?: string                 // Model number
  price?: number                 // Price
  currency: string               // Currency (default: USD)
  
  // Media
  imageUrl?: string              // Gear image
  videoUrl?: string              // Demo video
  
  // Creator Information
  creatorUid: string             // Creator UID
  creatorName: string            // Creator name
  
  // Affiliate/Links
  purchaseUrl?: string           // Purchase link
  affiliateUrl?: string          // Affiliate link
  
  // Status
  isActive: boolean              // Active status
  isRecommended: boolean         // Recommended flag
  
  // Timestamps
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update date
}
```

### **15. `progress` Collection**
**Purpose**: User learning progress tracking
**Document ID**: User UID
**Subcollection**: `items`

```typescript
// Main document: progress/{userId}
{
  userId: string                 // User UID
  totalLessonsCompleted: number  // Total completed lessons
  totalHoursSpent: number        // Total learning hours
  currentStreak: number          // Current learning streak
  longestStreak: number          // Longest learning streak
  lastActivityAt: Timestamp      // Last activity timestamp
  
  // Sports Progress
  sportsProgress: {              // Progress by sport
    [sport: string]: {
      lessonsCompleted: number
      hoursSpent: number
      skillLevel: string
      achievements: string[]
    }
  }
  
  // Goals
  goals: string[]                // Learning goals
  completedGoals: string[]       // Completed goals
  
  // Timestamps
  createdAt: Timestamp           // Progress tracking start
  updatedAt: Timestamp           // Last update
}

// Subcollection: progress/{userId}/items
{
  id: string                     // Progress item ID
  userId: string                 // User UID
  contentId: string              // Related content ID
  contentType: string            // Type of content
  
  // Progress Details
  completed: boolean             // Completion status
  progress: number               // Progress percentage (0-100)
  timeSpent: number              // Time spent in seconds
  
  // Learning Data
  skillLevel?: string            // Skill level achieved
  notes?: string                 // User notes
  rating?: number                // User rating (1-5)
  
  // Timestamps
  startedAt: Timestamp           // Start timestamp
  completedAt?: Timestamp        // Completion timestamp
  updatedAt: Timestamp           // Last update timestamp
}
```

### **16. `availability` Collection**
**Purpose**: Creator availability schedules
**Document ID**: Creator UID

```typescript
{
  uid: string                    // Creator UID
  slots: Array<{                 // Available time slots
    day: string                  // Day of week
    start: string                // Start time (HH:MM)
    end: string                  // End time (HH:MM)
    timezone: string             // Timezone
    isAvailable: boolean         // Availability status
  }>
  
  // Schedule Settings
  timezone: string               // Creator timezone
  advanceBookingDays: number     // Days in advance for booking
  sessionDuration: number        // Default session duration (minutes)
  
  // Timestamps
  updatedAt: Timestamp           // Last schedule update
}
```

### **17. `sessions` Collection**
**Purpose**: Coaching session management
**Document ID**: Auto-generated

```typescript
{
  // Session Information
  title: string                  // Session title
  description: string            // Session description
  userUid: string                // User UID
  creatorUid: string             // Creator UID
  
  // Scheduling
  scheduledAt: Timestamp         // Scheduled date/time
  duration: number               // Duration in minutes
  
  // Status
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  
  // Meeting Details
  meetingLink?: string           // Online meeting link
  meetingNotes?: string          // Session notes
  
  // Pricing
  price?: number                 // Session price
  isPaid: boolean                // Payment status
  
  // Timestamps
  createdAt: Timestamp           // Session creation
  updatedAt: Timestamp           // Last update
}
```

### **18. `requests` Collection**
**Purpose**: General user requests and inquiries
**Document ID**: Auto-generated

```typescript
{
  // Request Information
  uid: string                    // User UID
  type: string                   // Request type
  title: string                  // Request title
  description: string            // Request description
  
  // Target
  targetCreatorUid?: string      // Target creator (if applicable)
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  
  // Response
  response?: string              // Admin/creator response
  respondedBy?: string           // Responder UID
  respondedAt?: Timestamp        // Response timestamp
  
  // Timestamps
  createdAt: Timestamp           // Request creation
  updatedAt: Timestamp           // Last update
}
```

### **19. `admin` Collection**
**Purpose**: Administrative settings and configurations
**Document ID**: "settings"

```typescript
{
  // Platform Settings
  maintenanceMode: boolean       // Maintenance mode flag
  registrationEnabled: boolean   // New registration flag
  creatorApplicationsEnabled: boolean // Creator applications flag
  
  // Feature Flags
  features: {
    aiCoaching: boolean          // AI coaching feature
    liveSessions: boolean        // Live sessions feature
    gearRecommendations: boolean // Gear recommendations
    analytics: boolean           // Analytics feature
  }
  
  // Content Settings
  contentModeration: {
    autoApprove: boolean         // Auto-approve content
    requireReview: boolean       // Require manual review
    maxFileSize: number          // Maximum file size (MB)
  }
  
  // Notification Settings
  notifications: {
    emailEnabled: boolean        // Email notifications
    pushEnabled: boolean         // Push notifications
    smsEnabled: boolean          // SMS notifications
  }
  
  // Timestamps
  updatedAt: Timestamp           // Last settings update
  updatedBy: string              // Admin who updated
}
```

---

## 📈 **Analytics Collections (Optional)**

### **20. `creatorAnalytics` Collection**
**Purpose**: Creator performance metrics and analytics
**Document ID**: Creator UID

```typescript
{
  creatorUid: string             // Creator UID
  
  // Content Metrics
  totalContent: number           // Total content pieces
  publishedContent: number       // Published content
  draftContent: number           // Draft content
  
  // Engagement Metrics
  totalViews: number             // Total content views
  totalStudents: number          // Total students
  averageRating: number          // Average rating
  totalReviews: number           // Total reviews
  
  // Financial Metrics
  totalEarnings: number          // Total earnings
  monthlyEarnings: number        // Monthly earnings
  pendingEarnings: number        // Pending earnings
  
  // Performance Metrics
  completionRate: number         // Content completion rate
  retentionRate: number          // Student retention rate
  
  // Time Period
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  periodStart: Timestamp         // Period start
  periodEnd: Timestamp           // Period end
  
  // Timestamps
  lastCalculated: Timestamp      // Last calculation
  updatedAt: Timestamp           // Last update
}
```

### **21. `lessonAnalytics` Collection**
**Purpose**: Individual lesson performance analytics
**Document ID**: Content ID

```typescript
{
  contentId: string              // Content ID
  creatorUid: string             // Creator UID
  
  // View Metrics
  totalViews: number             // Total views
  uniqueViews: number            // Unique viewers
  averageWatchTime: number       // Average watch time (seconds)
  completionRate: number         // Completion rate (0-100)
  
  // Engagement Metrics
  likes: number                  // Number of likes
  shares: number                 // Number of shares
  comments: number               // Number of comments
  bookmarks: number              // Number of bookmarks
  
  // Rating Metrics
  averageRating: number          // Average rating (1-5)
  totalRatings: number           // Total ratings
  ratingDistribution: {          // Rating distribution
    '1': number
    '2': number
    '3': number
    '4': number
    '5': number
  }
  
  // Time Period
  period: 'daily' | 'weekly' | 'monthly'
  periodStart: Timestamp
  periodEnd: Timestamp
  
  // Timestamps
  lastCalculated: Timestamp
  updatedAt: Timestamp
}
```

### **22. `userAnalytics` Collection**
**Purpose**: User engagement and behavior analytics
**Document ID**: User UID

```typescript
{
  userId: string                 // User UID
  
  // Engagement Metrics
  totalSessions: number          // Total sessions
  averageSessionDuration: number // Average session duration
  totalContentViewed: number     // Total content viewed
  totalTimeSpent: number         // Total time spent (seconds)
  
  // Learning Metrics
  lessonsCompleted: number       // Lessons completed
  coursesCompleted: number       // Courses completed
  skillProgress: {               // Progress by skill
    [skill: string]: number      // Progress percentage
  }
  
  // Interaction Metrics
  coachingRequestsMade: number   // Coaching requests
  coachingSessionsCompleted: number // Coaching sessions
  
  // Time Period
  period: 'daily' | 'weekly' | 'monthly'
  periodStart: Timestamp
  periodEnd: Timestamp
  
  // Timestamps
  lastCalculated: Timestamp
  updatedAt: Timestamp
}
```

### **23. `systemAnalytics` Collection**
**Purpose**: Platform-wide metrics and system performance
**Document ID**: Date string (YYYY-MM-DD)

```typescript
{
  date: string                   // Date (YYYY-MM-DD)
  
  // User Metrics
  totalUsers: number             // Total registered users
  activeUsers: number            // Active users (last 30 days)
  newUsers: number               // New users today
  userRetentionRate: number      // User retention rate
  
  // Content Metrics
  totalContent: number           // Total content pieces
  newContent: number             // New content today
  contentViews: number           // Total content views
  
  // Creator Metrics
  totalCreators: number          // Total creators
  activeCreators: number         // Active creators
  newCreatorApplications: number // New applications
  
  // Financial Metrics
  totalRevenue: number           // Total revenue
  monthlyRevenue: number         // Monthly revenue
  averageRevenuePerUser: number  // ARPU
  
  // Performance Metrics
  averagePageLoadTime: number    // Average page load time
  errorRate: number              // Error rate percentage
  uptime: number                 // System uptime percentage
  
  // AI Metrics
  aiInteractions: number         // AI interactions
  aiResponseTime: number         // Average AI response time
  aiAccuracy: number             // AI accuracy percentage
  
  // Timestamps
  calculatedAt: Timestamp        // Calculation timestamp
  updatedAt: Timestamp           // Last update
}
```

---

## 🎯 **Required Data Seeding Checklist**

### **Essential Collections (Must Have)**
- [ ] **`users`** - At least 3 superadmins + sample users
- [ ] **`profiles`** - Complete profiles for all users
- [ ] **`contributorApplications`** - Sample applications
- [ ] **`creatorPublic`** - Public creator profiles
- [ ] **`creator_profiles`** - Private creator data
- [ ] **`content`** - Sample lessons and content
- [ ] **`coaching_requests`** - Sample coaching requests
- [ ] **`events`** - Sample scheduled events
- [ ] **`notifications`** - Sample notifications
- [ ] **`ai_interaction_logs`** - Sample AI logs
- [ ] **`ai_sessions`** - Sample AI sessions
- [ ] **`disclaimer_acceptances`** - Legal compliance data
- [ ] **`admin`** - Admin settings document

### **Recommended Collections (Should Have)**
- [ ] **`gear`** - Equipment recommendations
- [ ] **`progress`** - User progress tracking
- [ ] **`availability`** - Creator schedules
- [ ] **`sessions`** - Coaching sessions
- [ ] **`requests`** - General requests

### **Analytics Collections (Nice to Have)**
- [ ] **`creatorAnalytics`** - Creator performance
- [ ] **`lessonAnalytics`** - Content performance
- [ ] **`userAnalytics`** - User engagement
- [ ] **`systemAnalytics`** - Platform metrics

### **Minimum Data Requirements**
- **3 Superadmins** (joseph, lona, merline)
- **5 Regular Users** (different sports/levels)
- **3 Approved Creators** (different sports)
- **2 Pending Creator Applications**
- **10 Sample Content Pieces** (various sports/levels)
- **5 Coaching Requests** (different statuses)
- **3 Scheduled Events**
- **Admin Settings Document**
- **Legal Disclaimer Acceptances**

This comprehensive schema covers all data points needed for a fully functional Game Plan platform! 🚀
