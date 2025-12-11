# 💳 Complete Payment & Affiliate System - Implementation Guide

**Date:** 2025-10-13
**Status:** 🔵 Planning Phase - Ready for Implementation
**Goal:** Bulletproof payment system ready to activate with a switch

---

## 📚 Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Payment Structure & Tiers](#payment-structure--tiers)
3. [Stripe Integration](#stripe-integration)
4. [Affiliate System - User Referrals](#affiliate-system---user-referrals)
5. [Affiliate System - Product Links](#affiliate-system---product-links)
6. [Database Schema](#database-schema)
7. [Security & Access Control](#security--access-control)
8. [Admin Dashboard](#admin-dashboard)
9. [Implementation Phases](#implementation-phases)
10. [Feature Flags & Activation](#feature-flags--activation)
11. [Testing Strategy](#testing-strategy)
12. [Launch Checklist](#launch-checklist)

---

## 🎯 Overview & Architecture

### System Capabilities

This payment infrastructure handles:
1. **Stripe Payments** - Subscriptions, one-time payments, trials
2. **Multi-Tier Pricing** - Flexible tier system (coach/athlete)
3. **User Referral System** - Referral tracking and recurring commission payouts
4. **Product Affiliate System** - Gear/product recommendations with commission tracking
5. **Revenue Sharing** - Automated kickbacks for affiliate links

### High-Level Flow

```
User Signup
    ↓
Select Plan/Tier
    ↓
Stripe Checkout (with optional referral code)
    ↓
Payment Success → Webhook
    ↓
Grant Access + Track Referral
    ↓
Monthly Recurring Billing
    ↓
Calculate Affiliate Commissions
    ↓
Payout Processing (Stripe Connect/PayPal)
```

---

## 💰 Payment Structure & Tiers

### User Roles & Pricing

#### 1. **Coaches/Creators**

```javascript
{
  free: {
    name: "Free",
    price: 0,
    features: ["Basic profile", "5 lessons max", "10 athletes max"],
    limits: { lessons: 5, athletes: 10, storage: "1GB" }
  },
  starter: {
    name: "Starter",
    price: null, // TO BE DEFINED
    interval: "month",
    features: [
      "Unlimited lessons",
      "50 athletes",
      "Basic analytics",
      "Email support"
    ],
    limits: { lessons: -1, athletes: 50, storage: "10GB" }
  },
  pro: {
    name: "Pro",
    price: null, // TO BE DEFINED
    interval: "month",
    features: [
      "Everything in Starter",
      "Unlimited athletes",
      "Advanced analytics",
      "Priority support",
      "Custom branding"
    ],
    limits: { lessons: -1, athletes: -1, storage: "100GB" }
  },
  enterprise: {
    name: "Enterprise",
    price: null, // TO BE DEFINED - Custom pricing
    interval: "month",
    features: [
      "Everything in Pro",
      "White label",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee"
    ],
    limits: { lessons: -1, athletes: -1, storage: "unlimited" }
  }
}
```

#### 2. **Athletes**

```javascript
{
  free: {
    name: "Free",
    price: 0,
    features: [
      "Access to free lessons",
      "1 coach",
      "Basic progress tracking"
    ],
    limits: { coaches: 1, lessons: "free_only" }
  },
  premium: {
    name: "Premium",
    price: null, // TO BE DEFINED
    interval: "month",
    features: [
      "Access to all lessons",
      "Unlimited coaches",
      "Advanced progress tracking",
      "Video analysis",
      "Priority support"
    ],
    limits: { coaches: -1, lessons: "all" }
  }
}
```

#### 3. **One-Time Purchases** (Optional)

- Individual lesson purchases
- Course bundles
- 1-on-1 session bookings
- Video review credits

---

## 🔗 Stripe Integration

### 1. Products & Prices Setup

**One-Time Setup (via Stripe Dashboard or API):**

```typescript
// Create products in Stripe
const coachStarterProduct = await stripe.products.create({
  name: 'Coach Starter Plan',
  description: 'Unlimited lessons, 50 athletes, basic analytics'
})

// Create price for monthly billing
const coachStarterPrice = await stripe.prices.create({
  product: coachStarterProduct.id,
  unit_amount: 2900, // $29.00 - TO BE DEFINED
  currency: 'usd',
  recurring: {
    interval: 'month'
  }
})

// Store in Firestore for reference
await setDoc(doc(db, 'stripe_products', 'coach_starter'), {
  stripeProductId: coachStarterProduct.id,
  stripePriceId: coachStarterPrice.id,
  tier: 'starter',
  role: 'coach',
  active: true
})
```

### 2. User Subscription Data Model

```typescript
interface UserSubscription {
  userId: string
  role: 'coach' | 'athlete'

  // Subscription details
  tier: 'free' | 'starter' | 'pro' | 'premium' | 'enterprise'
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused'

  // Stripe data
  stripeCustomerId: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  stripeProductId?: string

  // Billing
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date

  // Affiliate tracking
  referredBy?: string // Affiliate userId who referred this user
  referralCode?: string

  // Usage tracking (for limit enforcement)
  usage: {
    lessonsCreated: number
    athletesCount: number
    storageUsedMB: number
  }

  // Metadata
  createdAt: Date
  updatedAt: Date
  canceledAt?: Date
}
```

### 3. Checkout Flow

**API Route: `/api/stripe/create-checkout-session`**

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const user = await verifyAuth(request)

  // 2. Get selected plan
  const { tier, role, referralCode } = await request.json()

  // 3. Get Stripe price ID from database
  const priceDoc = await getDoc(doc(db, 'stripe_products', `${role}_${tier}`))
  const stripePriceId = priceDoc.data().stripePriceId

  // 4. Create or retrieve Stripe customer
  let stripeCustomerId = user.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        firebaseUid: user.uid,
        role: role
      }
    })
    stripeCustomerId = customer.id

    // Save to user profile
    await updateDoc(doc(db, 'users', user.uid), {
      stripeCustomerId: customer.id
    })
  }

  // 5. Prepare metadata (including referral tracking)
  const metadata: any = {
    firebaseUid: user.uid,
    tier: tier,
    role: role
  }

  if (referralCode) {
    // Validate referral code
    const referralDoc = await getDoc(doc(db, 'referral_codes', referralCode))
    if (referralDoc.exists()) {
      metadata.referredBy = referralDoc.data().affiliateId
      metadata.referralCode = referralCode
    }
  }

  // 6. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1
      }
    ],
    metadata: metadata,
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription/canceled`,

    // Optional: Free trial
    subscription_data: {
      trial_period_days: 14, // TO BE DEFINED
      metadata: metadata
    }
  })

  return NextResponse.json({ sessionId: session.id, url: session.url })
}
```

### 4. Webhook Handler (Critical!)

**API Route: `/api/stripe/webhook`**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object)
      break

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { firebaseUid, tier, role, referredBy, referralCode } = session.metadata

  // 1. Create subscription record in Firestore
  await setDoc(doc(db, 'user_subscriptions', firebaseUid), {
    userId: firebaseUid,
    role: role,
    tier: tier,
    status: 'active',
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    referredBy: referredBy || null,
    referralCode: referralCode || null,
    currentPeriodStart: new Date(),
    createdAt: new Date(),
    usage: {
      lessonsCreated: 0,
      athletesCount: 0,
      storageUsedMB: 0
    }
  })

  // 2. Update user role/permissions
  await updateDoc(doc(db, 'users', firebaseUid), {
    subscriptionTier: tier,
    subscriptionStatus: 'active'
  })

  // 3. Track affiliate referral if exists
  if (referredBy && referralCode) {
    await createAffiliateReferral(
      referredBy,
      firebaseUid,
      referralCode,
      session.subscription as string
    )
  }

  // 4. Send welcome email
  await sendSubscriptionWelcomeEmail(firebaseUid, tier)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Calculate affiliate commission for this payment
  const subscription = await getDoc(
    doc(db, 'user_subscriptions', invoice.metadata.firebaseUid)
  )

  if (subscription.exists() && subscription.data().referredBy) {
    await calculateAndCreateCommission(
      subscription.data().referredBy,
      subscription.id,
      invoice.amount_paid,
      'subscription_revenue'
    )
  }
}
```

### 5. Feature Gating Middleware

```typescript
// Middleware to check subscription tier access
export async function requireSubscriptionTier(
  userId: string,
  requiredTier: 'starter' | 'pro' | 'premium' | 'enterprise'
) {
  const subscription = await getDoc(doc(db, 'user_subscriptions', userId))

  if (!subscription.exists()) {
    throw new Error('No active subscription')
  }

  const tierHierarchy = ['free', 'starter', 'pro', 'premium', 'enterprise']
  const userTierIndex = tierHierarchy.indexOf(subscription.data().tier)
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier)

  if (userTierIndex < requiredTierIndex) {
    throw new Error(`Upgrade to ${requiredTier} required`)
  }

  if (subscription.data().status !== 'active') {
    throw new Error('Subscription is not active')
  }

  return true
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)

  // Require Pro tier for this feature
  await requireSubscriptionTier(user.uid, 'pro')

  // Proceed with feature...
}
```

---

## 🤝 Affiliate System - User Referrals

### Overview

Coaches and athletes can refer new users to the platform and earn recurring commissions on their subscription fees.

### User Journey Flow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Coach A Generates Referral Link                │
├─────────────────────────────────────────────────────────┤
│ Dashboard → "Invite & Earn" → Generate Link             │
│ System creates: COACH-A-XYZ123                          │
│ Link: https://athleap.com/signup?ref=COACH-A-XYZ123    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Coach B Clicks Referral Link                   │
├─────────────────────────────────────────────────────────┤
│ Cookie set: ref=COACH-A-XYZ123 (30 days)               │
│ LocalStorage: referralCode = COACH-A-XYZ123            │
│ Track in analytics: referral_click event               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Coach B Signs Up & Selects Plan                │
├─────────────────────────────────────────────────────────┤
│ Signup form auto-fills referral code                   │
│ Validation: Check if code exists and is active         │
│ Metadata passed to Stripe checkout                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Webhook Creates Referral Record                │
├─────────────────────────────────────────────────────────┤
│ affiliate_referrals collection:                         │
│ - affiliateId: coach-a-uid                              │
│ - referredUserId: coach-b-uid                           │
│ - subscriptionId: sub_xyz                               │
│ - status: "active"                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Monthly Billing Creates Commission             │
├─────────────────────────────────────────────────────────┤
│ Every month when Coach B is billed:                    │
│ - Calculate commission (e.g., 20% of $29 = $5.80)      │
│ - Create commission record                              │
│ - Add to Coach A's pending balance                     │
│ - Continue for X months (e.g., 12)                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Monthly Payout Processing                      │
├─────────────────────────────────────────────────────────┤
│ If balance >= $50 minimum:                             │
│ - Transfer funds via Stripe Connect                    │
│ - OR: Mark for manual PayPal/bank transfer             │
│ - Send payout confirmation email                       │
└─────────────────────────────────────────────────────────┘
```

### Data Models

```typescript
// COLLECTION: referral_codes
interface ReferralCode {
  code: string // "COACH-A-XYZ123"
  affiliateId: string // User ID who owns this code
  affiliateType: 'coach' | 'athlete' | 'admin'

  active: boolean
  clicks: number
  conversions: number

  customCode?: string // Optional custom vanity code
  expiresAt?: Date

  createdAt: Date
  lastUsedAt?: Date
}

// COLLECTION: affiliate_referrals
interface AffiliateReferral {
  id: string

  // WHO
  affiliateId: string // Who made the referral
  affiliateName: string
  affiliateEmail: string

  referredUserId: string // Who was referred
  referredUserName: string
  referredUserEmail: string

  // TRACKING
  referralCode: string
  ipAddress?: string
  userAgent?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string

  // STATUS
  status: 'pending' | 'active' | 'converted' | 'expired' | 'fraudulent'

  // SUBSCRIPTION
  subscriptionId: string
  subscriptionTier: string
  subscriptionAmount: number // Monthly amount

  // COMMISSION TRACKING
  commissionRate: number // e.g., 0.20
  commissionMonthsRemaining: number // e.g., 12, 11, 10...
  totalCommissionEarned: number
  totalCommissionPaid: number
  totalCommissionPending: number

  // DATES
  referredAt: Date
  convertedAt: Date // When they actually paid
  subscriptionStartDate: Date
  subscriptionEndDate?: Date
  lastCommissionDate?: Date

  // FRAUD DETECTION
  fraudScore?: number
  fraudReasons?: string[]
}

// COLLECTION: affiliate_commissions
interface AffiliateCommission {
  id: string

  // WHO
  affiliateId: string
  referralId: string

  // WHAT
  amount: number
  currency: 'USD'
  type: 'subscription_revenue' | 'signup_bonus' | 'product_sale'

  // SOURCE
  sourceSubscriptionId?: string
  sourceInvoiceId?: string
  sourceProductSaleId?: string

  // STATUS
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'disputed'

  // PAYMENT
  payoutId?: string
  payoutMethod?: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'platform_credit'
  paidAt?: Date

  // METADATA
  description: string
  notes?: string

  createdAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
}

// COLLECTION: affiliate_programs (One per user who is an affiliate)
interface AffiliateProgram {
  userId: string

  // PROGRAM STATUS
  active: boolean
  approved: boolean
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' // Performance tiers

  // COMMISSION CONFIG
  commissionRate: number // Default: 0.20
  commissionMonths: number // Default: 12
  bonuses: {
    signupBonus?: number // One-time bonus per conversion
    tierBonusMultiplier?: number // 1.0, 1.1, 1.2, etc.
  }

  // PAYOUT CONFIG
  payoutMethod: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'platform_credit'
  payoutEmail?: string
  stripeConnectAccountId?: string
  paypalEmail?: string

  minimumPayout: number // Default: 50
  payoutFrequency: 'weekly' | 'monthly' | 'quarterly'

  // TOTALS
  totalReferrals: number
  totalConversions: number
  totalRevenue: number // Total revenue generated from referrals
  totalEarned: number // Total commission earned
  totalPending: number // Awaiting payout
  totalPaid: number // Already paid out

  // ANALYTICS
  conversionRate: number
  averageOrderValue: number
  lifetimeValue: number

  // DATES
  joinedAt: Date
  lastReferralAt?: Date
  lastPayoutAt?: Date
  nextPayoutDate?: Date

  // RESTRICTIONS
  suspended?: boolean
  suspensionReason?: string
  termsAcceptedAt?: Date
}
```

### Commission Calculation Engine

```typescript
async function calculateAndCreateCommission(
  affiliateId: string,
  referralId: string,
  paymentAmount: number,
  type: 'subscription_revenue' | 'product_sale'
) {
  // Get affiliate program config
  const affiliateProgramDoc = await getDoc(
    doc(db, 'affiliate_programs', affiliateId)
  )
  if (!affiliateProgramDoc.exists()) return

  const program = affiliateProgramDoc.data()

  // Calculate commission
  let commissionAmount = 0
  if (program.commissionType === 'percentage') {
    commissionAmount = paymentAmount * program.commissionRate
  } else {
    commissionAmount = program.commissionRate // Fixed amount
  }

  // Check if still within commission period
  const referral = await getDoc(doc(db, 'affiliate_referrals', referralId))
  const monthsSinceReferral = differenceInMonths(
    new Date(),
    referral.data().subscriptionStartDate
  )

  if (
    program.recurringMonths &&
    monthsSinceReferral >= program.recurringMonths
  ) {
    // Commission period expired
    return
  }

  // Create commission record
  await addDoc(collection(db, 'affiliate_commissions'), {
    affiliateId: affiliateId,
    referralId: referralId,
    amount: commissionAmount / 100, // Convert cents to dollars
    currency: 'USD',
    type: type,
    status: 'pending',
    description: `Commission from ${type === 'subscription_revenue' ? 'subscription payment' : 'product sale'}`,
    createdAt: new Date()
  })

  // Update referral totals
  await updateDoc(doc(db, 'affiliate_referrals', referralId), {
    commissionPending: increment(commissionAmount / 100)
  })

  // Update affiliate totals
  await updateDoc(doc(db, 'affiliate_programs', affiliateId), {
    totalEarned: increment(commissionAmount / 100),
    totalPending: increment(commissionAmount / 100)
  })
}
```

### Payout Processing

```typescript
// Manual admin trigger or automated monthly
async function processAffiliatePayout(affiliateId: string) {
  // 1. Get all pending commissions
  const commissionsQuery = query(
    collection(db, 'affiliate_commissions'),
    where('affiliateId', '==', affiliateId),
    where('status', '==', 'pending')
  )
  const commissionsSnap = await getDocs(commissionsQuery)

  const totalPayout = commissionsSnap.docs.reduce(
    (sum, doc) => sum + doc.data().amount,
    0
  )

  // Minimum payout threshold (e.g., $50)
  if (totalPayout < 50) {
    console.log(
      `Payout for ${affiliateId} below minimum threshold: $${totalPayout}`
    )
    return
  }

  // 2. Get affiliate payout preferences
  const affiliateDoc = await getDoc(doc(db, 'affiliate_programs', affiliateId))
  const payoutMethod = affiliateDoc.data().payoutMethod || 'stripe_transfer'

  // 3. Process payout via Stripe Connect or manual
  if (payoutMethod === 'stripe_transfer') {
    // Use Stripe Connect to transfer to affiliate's account
    const transfer = await stripe.transfers.create({
      amount: Math.floor(totalPayout * 100), // Convert to cents
      currency: 'usd',
      destination: affiliateDoc.data().stripeConnectAccountId,
      description: `Affiliate commission payout - ${commissionsSnap.size} referrals`
    })

    // Update commission records
    const batch = writeBatch(db)
    commissionsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'paid',
        paidAt: new Date(),
        payoutId: transfer.id
      })
    })
    await batch.commit()

    // Update affiliate totals
    await updateDoc(doc(db, 'affiliate_programs', affiliateId), {
      totalPaid: increment(totalPayout),
      totalPending: increment(-totalPayout),
      lastPayoutDate: new Date()
    })
  }
}
```

### API Endpoints

```typescript
// Generate referral code
POST /api/affiliate/generate-code
Request: { customCode?: string }
Response: { code: string, link: string }

// Get affiliate stats
GET /api/affiliate/stats
Response: {
  totalReferrals: number
  conversions: number
  pending: number
  earned: number
  paid: number
}

// Get referral history
GET /api/affiliate/referrals?page=1&limit=20
Response: {
  referrals: AffiliateReferral[]
  pagination: { page, limit, total }
}

// Get commission history
GET /api/affiliate/commissions?status=pending
Response: {
  commissions: AffiliateCommission[]
  totalPending: number
}

// Request payout
POST /api/affiliate/request-payout
Request: { method: 'stripe_connect' | 'paypal' }
Response: { success: boolean, payoutId: string }

// Validate referral code (public endpoint)
GET /api/affiliate/validate-code?code=COACH-A-XYZ123
Response: {
  valid: boolean
  affiliateName: string
  message: string
}
```

### Fraud Detection

```typescript
interface FraudCheck {
  // REFERRAL FRAUD
  selfReferral: boolean // User A refers User A with different email
  sameIPAddress: boolean // Referrer and referred from same IP
  rapidSignups: boolean // Multiple signups in short time
  immediateCancel: boolean // Sign up → cancel → repeat

  // CLICK FRAUD
  botTraffic: boolean // User agent indicates bot
  clickFarming: boolean // Excessive clicks without conversions
  geographicMismatch: boolean // Clicks from unusual locations

  // PAYMENT FRAUD
  cardTesting: boolean // Multiple failed payment attempts
  chargebackHistory: boolean // Previous chargebacks
  suspiciousEmail: boolean // Disposable email service
}

async function assessFraudRisk(
  referral: AffiliateReferral
): Promise<number> {
  let fraudScore = 0

  // Check if same IP
  const referrerUser = await getDoc(doc(db, 'users', referral.affiliateId))
  if (referral.ipAddress === referrerUser.data()?.lastIpAddress) {
    fraudScore += 30
  }

  // Check signup velocity
  const recentReferrals = await getDocs(
    query(
      collection(db, 'affiliate_referrals'),
      where('affiliateId', '==', referral.affiliateId),
      where('referredAt', '>=', subDays(new Date(), 1))
    )
  )
  if (recentReferrals.size > 10) {
    fraudScore += 40
  }

  // Check if email domains match (family/friends pattern)
  const referrerEmail = referrerUser.data()?.email
  const referredEmail = referral.referredUserEmail
  const referrerDomain = referrerEmail.split('@')[1]
  const referredDomain = referredEmail.split('@')[1]

  if (
    referrerDomain === referredDomain &&
    !['gmail.com', 'yahoo.com', 'outlook.com'].includes(referrerDomain)
  ) {
    fraudScore += 20
  }

  // Disposable email check
  if (isDisposableEmail(referredEmail)) {
    fraudScore += 50
  }

  return fraudScore // 0-100 scale
}

// Auto-flag suspicious referrals
if (fraudScore >= 70) {
  await updateDoc(doc(db, 'affiliate_referrals', referral.id), {
    status: 'fraudulent',
    fraudScore: fraudScore,
    fraudReasons: ['High fraud score detected']
  })

  // Hold commission payment
  await updateDoc(doc(db, 'affiliate_commissions', commissionId), {
    status: 'pending',
    notes: 'Held for fraud review'
  })

  // Alert admin
  await notifyAdmin('Suspicious referral activity', referral)
}
```

---

## 📦 Affiliate System - Product Links

### Overview

Coaches can embed affiliate links to products (Amazon, Nike, etc.) in their lessons and earn commissions on sales.

### Product Affiliate Flow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Coach Creates Lesson                           │
├─────────────────────────────────────────────────────────┤
│ Adds "Recommended Gear" section                         │
│ Selects: "Nike Baseball Glove"                          │
│ System generates affiliate link with coach's tag        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Athlete Views Lesson                           │
├─────────────────────────────────────────────────────────┤
│ Sees "Recommended Gear" section                         │
│ Clicks "Nike Baseball Glove" link                       │
│ Redirect: track click → forward to Amazon              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Athlete Purchases on Amazon                    │
├─────────────────────────────────────────────────────────┤
│ Amazon tracking tag: athleap-coach123-20               │
│ Purchase recorded in Amazon Associates                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Amazon Reports Sale (API or Manual)            │
├─────────────────────────────────────────────────────────┤
│ Option A: Amazon Product Advertising API               │
│ - Webhook with sale data                               │
│ Option B: Manual import from Amazon dashboard          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Platform Creates Commission Record             │
├─────────────────────────────────────────────────────────┤
│ Product sale: $50                                       │
│ Amazon commission: 4% = $2.00                           │
│ Platform keeps: 20% of $2.00 = $0.40                   │
│ Coach gets: 80% of $2.00 = $1.60                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Monthly Payout to Coach                        │
├─────────────────────────────────────────────────────────┤
│ Combine with subscription referral commissions         │
│ Pay out if balance >= minimum threshold                │
└─────────────────────────────────────────────────────────┘
```

### Product Affiliate Data Models

```typescript
// COLLECTION: product_affiliate_links
interface ProductAffiliateLink {
  id: string

  // PRODUCT INFO
  productId: string // Our internal ID
  productName: string
  productUrl: string // Original URL
  productImage?: string
  productPrice?: number
  productCategory:
    | 'gear'
    | 'equipment'
    | 'apparel'
    | 'supplements'
    | 'books'

  // AFFILIATE INFO
  provider: 'amazon' | 'nike' | 'dick_sporting_goods' | 'custom'
  affiliateTag: string // e.g., "athleap-coach123-20"
  trackingId: string

  // COACH INFO
  coachId: string
  coachName: string

  // WHERE USED
  lessonIds: string[] // Which lessons use this link

  // ANALYTICS
  clicks: number
  conversions: number
  revenue: number

  createdAt: Date
  lastClickedAt?: Date
}

// COLLECTION: product_sales
interface ProductSale {
  id: string

  // PRODUCT
  productAffiliateLinkId: string
  productName: string
  productCategory: string

  // SALE INFO
  saleAmount: number
  currency: 'USD'
  quantity: number

  // AFFILIATE PROVIDER
  provider: 'amazon' | 'nike' | 'custom'
  providerSaleId: string // Amazon order ID, etc.
  providerCommission: number // What Amazon paid us

  // COACH COMMISSION
  coachId: string
  coachCommissionRate: number // e.g., 0.80 (80% of provider commission)
  coachCommissionAmount: number
  platformCommissionAmount: number

  // TRACKING
  clickId?: string
  athleteId?: string // If logged in
  ipAddress?: string

  // STATUS
  status: 'pending' | 'confirmed' | 'canceled' | 'returned'

  // DATES
  saleDate: Date
  confirmedAt?: Date
  commissionPaidAt?: Date
}

// COLLECTION: affiliate_provider_configs
interface AffiliateProviderConfig {
  provider: 'amazon' | 'nike' | 'dick_sporting_goods'

  active: boolean

  // API CREDENTIALS
  apiKey?: string
  apiSecret?: string
  associateTag?: string // Master platform tag

  // COMMISSION SPLIT
  platformShare: number // e.g., 0.20 (platform keeps 20%)
  coachShare: number // e.g., 0.80 (coach gets 80%)

  // SETTINGS
  defaultCommissionRate: number // What provider typically pays
  minimumOrderValue?: number
  cookieDuration: number // Days (Amazon is 24 hours)

  // WEBHOOK
  webhookUrl?: string
  webhookSecret?: string

  createdAt: Date
  updatedAt: Date
}
```

### Amazon Associates Integration

```typescript
// Generating Amazon Affiliate Link
function generateAmazonAffiliateLink(
  productUrl: string,
  coachId: string
): string {
  // Parse Amazon URL
  const url = new URL(productUrl)

  // Generate unique tracking tag for this coach
  const affiliateTag = `athleap-coach${coachId.slice(0, 8)}-20`

  // Add tag parameter
  url.searchParams.set('tag', affiliateTag)

  // Our internal tracking
  const trackingId = generateTrackingId()

  // Create redirect through our system
  const trackedUrl = `${process.env.NEXT_PUBLIC_URL}/track/product/${trackingId}?dest=${encodeURIComponent(url.toString())}`

  return trackedUrl
}

// Track click and redirect
export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  const { trackingId } = params
  const destUrl = request.nextUrl.searchParams.get('dest')

  // Log click
  await addDoc(collection(db, 'product_clicks'), {
    trackingId,
    ipAddress: request.ip,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date()
  })

  // Increment click count
  await updateDoc(doc(db, 'product_affiliate_links', trackingId), {
    clicks: increment(1),
    lastClickedAt: new Date()
  })

  // Redirect to actual product
  return NextResponse.redirect(destUrl)
}
```

### Product Affiliate API Endpoints

```typescript
// Add product to lesson with affiliate link
POST /api/products/add-to-lesson
Request: {
  lessonId: string
  productUrl: string // Original Amazon/Nike URL
  productName: string
  productImage?: string
}
Response: {
  affiliateLink: string // Our tracked link
  trackingId: string
}

// Track product click
GET /api/products/track-click/:trackingId
-> Logs click, redirects to actual product

// Get product affiliate stats
GET /api/products/affiliate-stats
Response: {
  totalClicks: number
  totalSales: number
  totalRevenue: number
  pendingCommissions: number
}

// Import product sales (admin)
POST /api/admin/products/import-sales
Request: {
  provider: 'amazon'
  salesData: Array<{
    orderId: string
    productId: string
    amount: number
    commission: number
    date: string
  }>
}
```

---

## 🗄️ Database Schema

### Collections Overview

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

### 1. `users/` Collection (EXISTING - Add Fields)

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

### 2. `user_subscriptions/` Collection (NEW)

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
  status:
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'trialing'
    | 'paused'
    | 'incomplete'

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

- `userId` (automatic)
- `status + currentPeriodEnd`
- `referredBy + status`
- `tier + status`

### 3. `stripe_products/` Collection (NEW)

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

### Other Collections

See full detailed schema in `PAYMENT_DATABASE_SCHEMA.md` for all 14 collections with complete TypeScript interfaces.

---

## 🔒 Security & Access Control

### Firestore Security Rules

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

## 📊 Admin Dashboard

### Subscription Management View

Features:

- List all subscriptions
- Filter by tier, status, role
- Search by user email/name
- View subscription details
- Cancel/refund subscriptions
- Apply discounts/coupons

### Affiliate Management View

Features:

- List all affiliates
- View referral stats (conversions, revenue)
- Approve/reject commissions
- Process payouts
- View commission history
- Generate referral links

### Revenue Analytics

Metrics:

- MRR (Monthly Recurring Revenue)
- Churn rate
- LTV (Lifetime Value)
- Revenue by tier
- Affiliate revenue vs direct signups
- Growth metrics

---

## 🚀 Implementation Phases

### Phase 1: Core Stripe Integration (Week 1)

✅ Setup Stripe account
✅ Create products/prices in Stripe
✅ Build checkout flow API
✅ Implement webhook handler
✅ Create subscription data model
✅ Basic subscription management UI

### Phase 2: Feature Gating (Week 2)

✅ Implement tier-based access control
✅ Usage limits enforcement
✅ Upgrade/downgrade flows
✅ Cancellation flow
✅ Billing portal integration

### Phase 3: Affiliate System (Week 3)

✅ Referral code generation
✅ Referral tracking in checkout
✅ Commission calculation engine
✅ Affiliate dashboard UI
✅ Payout processing system

### Phase 4: Product Affiliate Links (Week 4)

✅ Gear recommendation system
✅ Amazon affiliate integration
✅ Click tracking
✅ Commission attribution
✅ Reporting dashboard

### Phase 5: Admin Tools (Week 5)

✅ Subscription management dashboard
✅ Affiliate approval/payout system
✅ Analytics and reporting
✅ Refund/discount tools

### Phase 6: Testing & Launch (Week 6)

✅ End-to-end testing
✅ Load testing
✅ Security audit
✅ Soft launch with beta users
✅ Full production launch

---

## 🎛️ Feature Flags & Activation

### Single Switch to Enable Payments

```typescript
// In Firebase Remote Config or Firestore
const FEATURE_FLAGS = {
  payments_enabled: false, // MASTER SWITCH
  free_trial_enabled: true,
  trial_days: 14,
  referral_program_enabled: false,
  product_affiliates_enabled: false,
  minimum_payout_threshold: 50,
  default_commission_rate: 0.2
}

// In code
export async function isPaymentsEnabled(): Promise<boolean> {
  const flags = await getDoc(doc(db, 'config', 'feature_flags'))
  return flags.data()?.payments_enabled || false
}

// Usage
if (await isPaymentsEnabled()) {
  // Show pricing page
} else {
  // Show "Coming Soon" or free tier only
}
```

### Environment Variables Needed

```bash
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect (for affiliate payouts)
STRIPE_CONNECT_CLIENT_ID=ca_...

# Feature Flags
PAYMENTS_ENABLED=false
FREE_TRIAL_DAYS=14
REFERRAL_COMMISSION_RATE=0.20
MINIMUM_PAYOUT_THRESHOLD=50

# URLs
NEXT_PUBLIC_URL=https://yourdomain.com
STRIPE_SUCCESS_URL=${NEXT_PUBLIC_URL}/subscription/success
STRIPE_CANCEL_URL=${NEXT_PUBLIC_URL}/subscription/canceled
```

---

## 🧪 Testing Strategy

### Test Scenarios

**1. Checkout Flow**

- Successful payment
- Failed payment
- Canceled checkout
- Trial period activation

**2. Subscription Lifecycle**

- New subscription creation
- Monthly renewal
- Upgrade/downgrade
- Cancellation
- Reactivation

**3. Affiliate Tracking**

- Referral link click → signup → conversion
- Commission calculation
- Multiple referrals from same affiliate
- Commission payout

**4. Edge Cases**

- Duplicate webhook events
- Failed webhook delivery
- Partial refunds
- Subscription pausing
- Payment method updates

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Authentication: 4000 0025 0000 3155
```

---

## ✅ Launch Checklist

### Key Decisions Needed Before Launch

**1. Pricing Structure**

- [ ] Coach tier prices (Starter, Pro, Enterprise)
- [ ] Athlete tier prices (Free, Premium)
- [ ] One-time purchase prices (if applicable)
- [ ] Free trial duration (14 days? 30 days?)

**2. Affiliate Program Terms**

- [ ] Commission rate (% or fixed)
- [ ] Recurring commission months (e.g., 12 months)
- [ ] Minimum payout threshold ($50? $100?)
- [ ] Payout frequency (monthly? quarterly?)

**3. Product Affiliate Strategy**

- [ ] Which affiliate programs to integrate (Amazon, Nike, etc.)
- [ ] Commission split (platform vs coach)
- [ ] Product categories to support

**4. Refund/Cancellation Policy**

- [ ] Refund window (30 days?)
- [ ] Pro-rated refunds?
- [ ] Cancel immediately vs at period end?

### When You Have Pricing Figured Out

1. [ ] Define tier prices in pricing structure
2. [ ] Create Stripe products/prices
3. [ ] Update `stripe_products` collection in Firestore
4. [ ] Set commission rates in affiliate program config
5. [ ] Update environment variables
6. [ ] Set `PAYMENTS_ENABLED=true`
7. [ ] Test checkout flow end-to-end
8. [ ] Verify webhooks are working
9. [ ] Test affiliate tracking
10. [ ] Launch! 🚀

---

## 🎉 Ready to Build

**This plan is implementation-ready.** Once you have your pricing structure, we can start building and have payments live within 6 weeks.

### Next Steps

1. **Review this plan** - Make sure it covers all your needs
2. **Define pricing** - Work out your tier structure and commission rates
3. **Create Stripe account** - Get test and live API keys
4. **Green light implementation** - When ready, we build this in phases

---

## 📖 Additional Documentation

For more detailed information, refer to:

- `PAYMENT_SYSTEM_MASTER_PLAN.md` - Original detailed payment plan
- `AFFILIATE_SYSTEM_ARCHITECTURE.md` - Deep dive into affiliate system
- `PAYMENT_DATABASE_SCHEMA.md` - Complete Firestore schema with all 14 collections

**Questions? Let's refine this plan before implementation! 🎯**
