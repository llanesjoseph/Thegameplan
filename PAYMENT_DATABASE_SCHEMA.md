# 🗄️ Payment & Affiliate Database Schema

**Date:** 2025-10-13
**Purpose:** Complete Firestore collection structure for payment & affiliate systems

---

## 📋 Collections Overview

```
firestore/
├── users/                          (existing - add fields)
├── user_subscriptions/             (NEW)
├── stripe_products/                (NEW)
├── stripe_customers/               (NEW)
├── referral_codes/                 (NEW)
├── affiliate_programs/             (NEW)
├── affiliate_referrals/            (NEW)
├── affiliate_commissions/          (NEW)
├── product_affiliate_links/        (NEW)
├── product_sales/                  (NEW)
├── product_clicks/                 (NEW)
├── affiliate_provider_configs/     (NEW)
├── affiliate_payouts/              (NEW)
└── payment_transactions/           (NEW)
```

---

## 1. `users/` Collection (EXISTING - Add Fields)

**Add these fields to existing user documents:**

```typescript
interface User {
  // ... existing fields ...

  // SUBSCRIPTION INFO
  subscriptionTier?: 'free' | 'starter' | 'pro' | 'premium' | 'enterprise'
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing'
  stripeCustomerId?: string

  // AFFILIATE INFO
  isAffiliate?: boolean
  affiliateCode?: string // Their unique referral code
  referredBy?: string // User ID who referred them

  // TRACKING
  lastIpAddress?: string
  signupSource?: 'organic' | 'referral' | 'ad' | 'social'
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}
```

---

## 2. `user_subscriptions/` Collection (NEW)

**Document ID:** `{userId}`

```typescript
interface UserSubscription {
  // USER INFO
  userId: string
  userEmail: string
  userName: string
  role: 'coach' | 'athlete'

  // SUBSCRIPTION DETAILS
  tier: 'free' | 'starter' | 'pro' | 'premium' | 'enterprise'
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused' | 'incomplete'

  // STRIPE REFERENCES
  stripeCustomerId: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  stripeProductId?: string

  // BILLING
  amount: number // Monthly amount in cents
  currency: 'USD'
  interval: 'month' | 'year'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean

  // TRIAL
  trialStart?: Date
  trialEnd?: Date
  inTrial: boolean

  // AFFILIATE TRACKING
  referredBy?: string // Affiliate userId
  referralCode?: string

  // USAGE LIMITS
  limits: {
    lessons: number // -1 for unlimited
    athletes: number
    storage: number // In MB
    videos: number
  }

  // CURRENT USAGE
  usage: {
    lessonsCreated: number
    athletesCount: number
    storageUsedMB: number
    videosUploaded: number
  }

  // PAYMENT HISTORY
  lastPaymentDate?: Date
  lastPaymentAmount?: number
  nextPaymentDate?: Date
  paymentsFailed: number

  // LIFECYCLE
  createdAt: Date
  updatedAt: Date
  canceledAt?: Date
  cancellationReason?: string
  pausedAt?: Date
  resumedAt?: Date

  // METADATA
  metadata?: Record<string, any>
}
```

**Indexes:**
```javascript
// Composite indexes needed
- userId (automatic)
- status + currentPeriodEnd
- referredBy + status
- tier + status
```

---

## 3. `stripe_products/` Collection (NEW)

**Document ID:** `{role}_{tier}` (e.g., `coach_pro`)

```typescript
interface StripeProduct {
  // PRODUCT IDENTITY
  role: 'coach' | 'athlete'
  tier: 'starter' | 'pro' | 'premium' | 'enterprise'
  name: string // "Coach Pro Plan"
  description: string

  // STRIPE REFERENCES
  stripeProductId: string
  stripePriceId: string // Monthly price
  stripePriceIdYearly?: string // Optional yearly price

  // PRICING
  monthlyPrice: number // In cents
  yearlyPrice?: number
  currency: 'USD'

  // FEATURES
  features: string[]
  limits: {
    lessons: number
    athletes: number
    storage: number
    videos: number
  }

  // TRIAL
  trialDays?: number

  // STATUS
  active: boolean
  featured: boolean
  popular: boolean

  // DISPLAY
  displayOrder: number
  badge?: string // "Most Popular", "Best Value"

  // METADATA
  createdAt: Date
  updatedAt: Date
}
```

---

## 4. `stripe_customers/` Collection (NEW)

**Document ID:** `{stripeCustomerId}`

```typescript
interface StripeCustomer {
  stripeCustomerId: string
  userId: string
  email: string

  // PAYMENT METHODS
  defaultPaymentMethod?: string
  paymentMethods: Array<{
    id: string
    brand: string // visa, mastercard
    last4: string
    expMonth: number
    expYear: number
  }>

  // BILLING INFO
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }

  // METADATA
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. `referral_codes/` Collection (NEW)

**Document ID:** `{code}` (e.g., `COACH-JOHN-XYZ123`)

```typescript
interface ReferralCode {
  code: string // The actual referral code
  affiliateId: string // User ID who owns this code
  affiliateName: string
  affiliateEmail: string
  affiliateType: 'coach' | 'athlete' | 'admin'

  // STATUS
  active: boolean
  verified: boolean // Email/identity verified

  // ANALYTICS
  clicks: number
  signups: number // Accounts created
  conversions: number // Paid subscriptions
  conversionRate: number

  // CUSTOMIZATION
  isCustomCode: boolean // true if user chose vanity code
  defaultCode: string // Auto-generated code if custom exists

  // EXPIRATION
  expiresAt?: Date
  neverExpires: boolean

  // TRACKING
  createdAt: Date
  lastUsedAt?: Date
  lastConversionAt?: Date
}
```

**Indexes:**
- `affiliateId`
- `active + affiliateId`

---

## 6. `affiliate_programs/` Collection (NEW)

**Document ID:** `{userId}`

```typescript
interface AffiliateProgram {
  userId: string
  userName: string
  userEmail: string
  userRole: 'coach' | 'athlete'

  // PROGRAM STATUS
  active: boolean
  approved: boolean
  approvedAt?: Date
  approvedBy?: string // Admin userId

  suspended: boolean
  suspensionReason?: string
  suspendedAt?: Date

  // TIER SYSTEM
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tierBenefits: {
    commissionRate: number // 0.20, 0.22, 0.25, etc.
    commissionMonths: number // 12, 18, 24, etc.
    signupBonus: number // One-time bonus per conversion
  }

  // COMMISSION CONFIG
  commissionRate: number // Current rate (overridden by tier)
  commissionMonths: number
  commissionType: 'recurring' | 'one_time'

  // PAYOUT CONFIG
  payoutMethod: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'platform_credit'
  payoutEmail?: string
  stripeConnectAccountId?: string
  paypalEmail?: string
  bankAccountLast4?: string

  minimumPayout: number // Default: 50
  payoutFrequency: 'weekly' | 'monthly' | 'quarterly'
  nextPayoutDate?: Date

  // REFERRAL STATS
  totalReferrals: number // Total people who clicked
  totalSignups: number // Total accounts created
  totalConversions: number // Total paid subscriptions
  activeConversions: number // Currently active subscriptions

  // REVENUE STATS
  totalRevenueGenerated: number // Total subscription $ from referrals
  totalCommissionEarned: number // Total $ earned
  totalCommissionPending: number // Awaiting approval/payout
  totalCommissionPaid: number // Already paid out

  // PERFORMANCE METRICS
  conversionRate: number
  averageOrderValue: number
  customerLifetimeValue: number

  // PRODUCT AFFILIATES
  productAffiliatesEnabled: boolean
  totalProductSales: number
  totalProductCommission: number

  // TERMS
  termsAcceptedAt?: Date
  termsVersion: string

  // LIFECYCLE
  joinedAt: Date
  lastReferralAt?: Date
  lastPayoutAt?: Date
  lastUpdatedAt: Date

  // FRAUD DETECTION
  fraudScore: number // 0-100
  flaggedForReview: boolean
  reviewReason?: string
}
```

**Indexes:**
- `active + tier`
- `approved + active`
- `totalConversions` (for leaderboards)

---

## 7. `affiliate_referrals/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface AffiliateReferral {
  id: string

  // AFFILIATE (REFERRER)
  affiliateId: string
  affiliateName: string
  affiliateEmail: string

  // REFERRED USER
  referredUserId: string
  referredUserName: string
  referredUserEmail: string
  referredUserRole: 'coach' | 'athlete'

  // REFERRAL TRACKING
  referralCode: string
  referralLink: string

  // ATTRIBUTION
  ipAddress: string
  userAgent: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  clickId?: string

  // STATUS
  status: 'clicked' | 'signed_up' | 'converted' | 'active' | 'expired' | 'canceled' | 'fraudulent'

  // SUBSCRIPTION INFO (when converted)
  subscriptionId?: string
  subscriptionTier?: string
  subscriptionAmount: number // Monthly amount

  // COMMISSION SETTINGS
  commissionRate: number
  commissionMonthsTotal: number
  commissionMonthsRemaining: number

  // COMMISSION TRACKING
  totalCommissionEarned: number
  totalCommissionPaid: number
  totalCommissionPending: number
  commissionsCreatedCount: number

  // DATES
  clickedAt: Date
  signedUpAt?: Date // Account created
  convertedAt?: Date // Paid subscription started
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  lastCommissionDate?: Date
  expiresAt?: Date

  // FRAUD DETECTION
  fraudScore: number
  fraudReasons: string[]
  flaggedForReview: boolean
  reviewedAt?: Date
  reviewedBy?: string

  // METADATA
  notes?: string
  metadata?: Record<string, any>
}
```

**Indexes:**
- `affiliateId + status`
- `referredUserId`
- `status + convertedAt`
- `affiliateId + convertedAt`

---

## 8. `affiliate_commissions/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface AffiliateCommission {
  id: string

  // WHO
  affiliateId: string
  referralId: string
  referredUserId: string

  // AMOUNT
  amount: number // In dollars
  currency: 'USD'

  // TYPE
  type: 'subscription_revenue' | 'signup_bonus' | 'product_sale' | 'tier_bonus'

  // SOURCE
  sourceType: 'subscription' | 'product' | 'bonus'
  sourceSubscriptionId?: string
  sourceInvoiceId?: string
  sourceProductSaleId?: string

  // STATUS
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'disputed' | 'reversed'

  // APPROVAL
  approvedAt?: Date
  approvedBy?: string // Admin userId
  rejectedAt?: Date
  rejectedBy?: string
  rejectionReason?: string

  // PAYOUT
  payoutId?: string
  payoutBatchId?: string
  payoutMethod?: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'platform_credit'
  paidAt?: Date
  paymentReference?: string

  // DISPUTE
  disputedAt?: Date
  disputeReason?: string
  disputeResolvedAt?: Date

  // REVERSAL (if subscription canceled/refunded)
  reversedAt?: Date
  reversalReason?: string
  reversalAmount?: number

  // DESCRIPTION
  description: string
  internalNotes?: string

  // METADATA
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}
```

**Indexes:**
- `affiliateId + status`
- `status + createdAt`
- `affiliateId + createdAt`
- `payoutId`

---

## 9. `product_affiliate_links/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface ProductAffiliateLink {
  id: string

  // PRODUCT INFO
  productName: string
  productDescription?: string
  productUrl: string // Original URL (Amazon, etc.)
  productImage?: string
  productPrice?: number
  productCategory: 'gear' | 'equipment' | 'apparel' | 'supplements' | 'books' | 'other'
  productBrand?: string

  // AFFILIATE PROVIDER
  provider: 'amazon' | 'nike' | 'dick_sporting_goods' | 'custom'
  providerProductId?: string
  affiliateTag: string // e.g., "athleap-coach123-20"

  // COACH WHO LINKED IT
  coachId: string
  coachName: string

  // TRACKING ID
  trackingId: string // Our unique ID for this link
  shortUrl?: string // Optional short URL

  // WHERE USED
  lessonIds: string[] // Lessons that include this link
  usageCount: number

  // ANALYTICS
  clicks: number
  uniqueClicks: number
  conversions: number
  totalRevenue: number
  totalCommission: number

  // STATUS
  active: boolean
  verified: boolean // Provider verified the link works

  // DATES
  createdAt: Date
  lastClickedAt?: Date
  lastConversionAt?: Date
  verifiedAt?: Date
}
```

**Indexes:**
- `coachId + active`
- `trackingId` (for fast lookups on click)
- `provider + active`

---

## 10. `product_sales/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface ProductSale {
  id: string

  // PRODUCT
  productAffiliateLinkId: string
  productName: string
  productCategory: string

  // SALE INFO
  saleAmount: number
  quantity: number
  currency: 'USD'

  // PROVIDER INFO
  provider: 'amazon' | 'nike' | 'custom'
  providerSaleId: string // External order ID
  providerCommission: number // What provider paid us
  providerCommissionRate: number

  // COACH COMMISSION
  coachId: string
  coachCommissionRate: number // e.g., 0.80 (80% of provider commission)
  coachCommissionAmount: number

  // PLATFORM COMMISSION
  platformCommissionAmount: number

  // BUYER (if known)
  athleteId?: string
  athleteEmail?: string

  // TRACKING
  clickId?: string
  ipAddress?: string
  userAgent?: string

  // STATUS
  status: 'pending' | 'confirmed' | 'canceled' | 'returned' | 'refunded'

  // COMMISSION CREATED
  commissionRecordId?: string // Link to affiliate_commissions doc

  // DATES
  saleDate: Date
  clickDate?: Date
  confirmedAt?: Date
  commissionPaidAt?: Date
  canceledAt?: Date
  refundedAt?: Date

  // METADATA
  notes?: string
  metadata?: Record<string, any>
}
```

**Indexes:**
- `coachId + status`
- `status + saleDate`
- `providerSaleId`

---

## 11. `product_clicks/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface ProductClick {
  id: string

  // CLICK INFO
  trackingId: string // Product affiliate link tracking ID
  productAffiliateLinkId: string

  // USER INFO
  athleteId?: string // If logged in
  ipAddress: string
  userAgent: string
  referrerUrl?: string

  // GEO
  country?: string
  region?: string
  city?: string

  // CONVERSION
  converted: boolean
  conversionDate?: Date
  saleId?: string

  // TIMESTAMP
  clickedAt: Date
}
```

**Indexes:**
- `trackingId + clickedAt`
- `athleteId + clickedAt`
- `converted + clickedAt`

---

## 12. `affiliate_provider_configs/` Collection (NEW)

**Document ID:** `{provider}` (e.g., `amazon`)

```typescript
interface AffiliateProviderConfig {
  provider: 'amazon' | 'nike' | 'dick_sporting_goods' | 'custom'

  // STATUS
  active: boolean
  enabled: boolean

  // PLATFORM CREDENTIALS
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  masterAffiliateTag?: string // Platform's tag

  // COMMISSION SPLIT
  platformShare: number // e.g., 0.20 (platform keeps 20%)
  coachShare: number // e.g., 0.80 (coach gets 80%)

  // PROVIDER SETTINGS
  defaultCommissionRate: number // Provider's typical rate
  minimumOrderValue?: number
  cookieDuration: number // Days
  supportedCountries: string[]

  // API SETTINGS
  apiEndpoint?: string
  apiVersion?: string
  webhookUrl?: string
  webhookSecret?: string

  // RATE LIMITS
  rateLimitPerHour?: number
  rateLimitPerDay?: number

  // METADATA
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date
}
```

---

## 13. `affiliate_payouts/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface AffiliatePayout {
  id: string

  // AFFILIATE
  affiliateId: string
  affiliateName: string
  affiliateEmail: string

  // PAYOUT AMOUNT
  amount: number
  currency: 'USD'
  commissionsIncluded: number // Number of commission records

  // METHOD
  method: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'platform_credit'

  // STRIPE/PAYPAL INFO
  stripeTransferId?: string
  paypalTransactionId?: string
  bankReferenceNumber?: string

  // STATUS
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed'

  // FAILURE
  failureReason?: string
  retryCount: number

  // COMMISSION IDS
  commissionIds: string[] // All commission records in this payout

  // DATES
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
  failedAt?: Date

  // METADATA
  notes?: string
  metadata?: Record<string, any>
}
```

**Indexes:**
- `affiliateId + status`
- `status + requestedAt`

---

## 14. `payment_transactions/` Collection (NEW)

**Document ID:** Auto-generated

```typescript
interface PaymentTransaction {
  id: string

  // USER
  userId: string
  userEmail: string
  stripeCustomerId: string

  // TRANSACTION
  type: 'charge' | 'refund' | 'dispute' | 'payout'
  amount: number
  currency: 'USD'
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed'

  // STRIPE REFERENCES
  stripeChargeId?: string
  stripeInvoiceId?: string
  stripeRefundId?: string
  stripeDisputeId?: string

  // SUBSCRIPTION LINK
  subscriptionId?: string

  // AFFILIATE LINK
  generatedCommission: boolean
  commissionId?: string

  // FAILURE INFO
  failureCode?: string
  failureMessage?: string

  // DATES
  createdAt: Date
  succeededAt?: Date
  failedAt?: Date
  refundedAt?: Date

  // METADATA
  description: string
  metadata?: Record<string, any>
}
```

---

## 🔒 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // user_subscriptions - users can read their own, admins can read all
    match /user_subscriptions/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if false; // Only server (Admin SDK) can write
    }

    // stripe_products - public read, admin write
    match /stripe_products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // referral_codes - read own codes, admin writes
    match /referral_codes/{code} {
      allow read: if isAuthenticated() &&
                     (resource.data.affiliateId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }

    // affiliate_programs - read own program, admin manages
    match /affiliate_programs/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
    }

    // affiliate_referrals - affiliates can read their referrals
    match /affiliate_referrals/{referralId} {
      allow read: if isAuthenticated() &&
                     (resource.data.affiliateId == request.auth.uid || isAdmin());
      allow write: if false; // Only server
    }

    // affiliate_commissions - affiliates can read their commissions
    match /affiliate_commissions/{commissionId} {
      allow read: if isAuthenticated() &&
                     (resource.data.affiliateId == request.auth.uid || isAdmin());
      allow write: if false; // Only server
    }

    // product_affiliate_links - coaches can read/manage their links
    match /product_affiliate_links/{linkId} {
      allow read: if true; // Public read for displaying products
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
                               resource.data.coachId == request.auth.uid;
    }

    // product_sales - coaches can read their sales
    match /product_sales/{saleId} {
      allow read: if isAuthenticated() &&
                     (resource.data.coachId == request.auth.uid || isAdmin());
      allow write: if false; // Only server
    }

    // affiliate_payouts - affiliates can read their payouts
    match /affiliate_payouts/{payoutId} {
      allow read: if isAuthenticated() &&
                     (resource.data.affiliateId == request.auth.uid || isAdmin());
      allow write: if false; // Only server
    }

    // payment_transactions - users can read their own
    match /payment_transactions/{transactionId} {
      allow read: if isAuthenticated() &&
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow write: if false; // Only server
    }
  }
}
```

---

## 📊 Helpful Queries

### Get Active Subscriptions Expiring Soon
```typescript
const expiringSubscriptions = await getDocs(
  query(
    collection(db, 'user_subscriptions'),
    where('status', '==', 'active'),
    where('currentPeriodEnd', '<=', addDays(new Date(), 7)),
    orderBy('currentPeriodEnd', 'asc')
  )
)
```

### Get Top Affiliates This Month
```typescript
const topAffiliates = await getDocs(
  query(
    collection(db, 'affiliate_programs'),
    where('active', '==', true),
    orderBy('totalCommissionEarned', 'desc'),
    limit(10)
  )
)
```

### Get Pending Commissions Ready for Payout
```typescript
const pendingCommissions = await getDocs(
  query(
    collection(db, 'affiliate_commissions'),
    where('status', '==', 'approved'),
    where('paidAt', '==', null)
  )
)
```

### Get Affiliate's Active Referrals
```typescript
const activeReferrals = await getDocs(
  query(
    collection(db, 'affiliate_referrals'),
    where('affiliateId', '==', userId),
    where('status', 'in', ['active', 'converted'])
  )
)
```

---

## ✅ Schema Complete

This database schema is production-ready and supports:
- ✅ Stripe subscription management
- ✅ Multi-tier pricing
- ✅ User referral tracking
- ✅ Product affiliate links
- ✅ Commission calculations
- ✅ Payout processing
- ✅ Fraud detection
- ✅ Analytics & reporting

Ready to implement when pricing is defined! 🚀
