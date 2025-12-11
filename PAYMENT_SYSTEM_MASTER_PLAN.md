# 💳 Payment System Master Plan - Stripe + Affiliate Kickbacks

**Date:** 2025-10-13
**Status:** 🔵 Planning Phase - Ready for Implementation
**Goal:** Bulletproof payment system ready to activate with a switch

---

## 🎯 Overview

A complete payment infrastructure that handles:
1. **Stripe Payments** - Subscriptions, one-time payments, trials
2. **Multi-Tier Pricing** - Flexible tier system (coach/athlete)
3. **Affiliate System** - Referral tracking and commission payouts
4. **Revenue Sharing** - Kickbacks for gear/product affiliate links

---

## 📊 System Architecture

### High-Level Flow
```
User Signup
    ↓
Select Plan/Tier
    ↓
Stripe Checkout
    ↓
Payment Success → Webhook
    ↓
Grant Access + Track Referral
    ↓
Monthly Recurring Billing
    ↓
Calculate Affiliate Commissions
    ↓
Payout Processing
```

---

## 💰 Payment Structure (To Be Defined)

### User Roles That Need Pricing:

#### 1. **Coaches/Creators**
```javascript
// Placeholder tier structure
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
    features: ["Unlimited lessons", "50 athletes", "Basic analytics"],
    limits: { lessons: -1, athletes: 50, storage: "10GB" }
  },
  pro: {
    name: "Pro",
    price: null, // TO BE DEFINED
    interval: "month",
    features: ["Everything in Starter", "Unlimited athletes", "Advanced analytics", "Priority support"],
    limits: { lessons: -1, athletes: -1, storage: "100GB" }
  },
  enterprise: {
    name: "Enterprise",
    price: null, // TO BE DEFINED - Custom pricing
    interval: "month",
    features: ["Everything in Pro", "White label", "Custom integrations", "Dedicated support"],
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
    features: ["Access to free lessons", "1 coach", "Basic progress tracking"],
    limits: { coaches: 1, lessons: "free_only" }
  },
  premium: {
    name: "Premium",
    price: null, // TO BE DEFINED
    interval: "month",
    features: ["Access to all lessons", "Unlimited coaches", "Advanced progress tracking", "Video analysis"],
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

## 🔗 Affiliate System Architecture

### Two Types of Affiliates:

#### 1. **User Referral Program** (Coach/Athlete Referrals)
```
Coach A refers Coach B
    ↓
Coach B signs up with referral code: COACH-A-REF
    ↓
Coach B subscribes to Pro plan
    ↓
Coach A gets commission (e.g., 20% recurring for 12 months)
```

#### 2. **Product/Gear Affiliate Links** (Amazon, Training Gear, etc.)
```
Coach creates lesson with gear recommendation
    ↓
Embeds affiliate link: https://amazon.com/product?tag=COACH-123
    ↓
Athlete clicks and purchases
    ↓
Amazon reports sale via API
    ↓
Platform tracks commission for Coach
```

### Affiliate Data Model:
```typescript
interface AffiliateProgram {
  id: string
  type: 'user_referral' | 'product_link'
  affiliateId: string // Coach/user who refers

  // Referral program config
  commissionRate: number // e.g., 0.20 for 20%
  commissionType: 'percentage' | 'fixed'
  recurringMonths?: number // How many months commission continues

  // Product affiliate config (for gear links)
  productProvider: 'amazon' | 'nike' | 'custom'
  apiKey?: string
  trackingTag?: string
}

interface AffiliateReferral {
  id: string
  affiliateId: string // Who made the referral
  referredUserId: string // Who signed up
  referralCode: string
  dateReferred: Date
  status: 'pending' | 'active' | 'converted' | 'expired'

  // Subscription tracking
  subscriptionId?: string
  subscriptionStartDate?: Date
  commissionPaid: number
  commissionPending: number

  // Attribution
  source: 'link' | 'code' | 'email_invite'
  utmParams?: Record<string, string>
}

interface AffiliateCommission {
  id: string
  affiliateId: string
  referralId?: string // If from user referral
  productSaleId?: string // If from product link

  amount: number
  currency: 'USD'
  type: 'subscription_revenue' | 'product_sale'

  status: 'pending' | 'approved' | 'paid' | 'disputed'

  // Payment details
  paymentMethod: 'stripe_transfer' | 'paypal' | 'manual'
  paidAt?: Date
  payoutId?: string

  // Metadata
  description: string
  createdAt: Date
  approvedAt?: Date
}
```

---

## 🏗️ Stripe Integration Architecture

### 1. **Stripe Products & Prices Setup**

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

### 2. **User Subscription Data Model**

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

### 3. **Checkout Flow**

**Frontend → Backend API → Stripe Checkout:**

```typescript
// API Route: /api/stripe/create-checkout-session
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

### 4. **Webhook Handler** (Critical!)

**API Route: `/api/stripe/webhook`**

```typescript
// Handle all Stripe events
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
    await createAffiliateReferral(referredBy, firebaseUid, referralCode, session.subscription as string)
  }

  // 4. Send welcome email
  await sendSubscriptionWelcomeEmail(firebaseUid, tier)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Calculate affiliate commission for this payment
  const subscription = await getDoc(doc(db, 'user_subscriptions', invoice.metadata.firebaseUid))

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

---

## 💸 Affiliate Commission System

### Commission Calculation Logic

```typescript
async function calculateAndCreateCommission(
  affiliateId: string,
  referralId: string,
  paymentAmount: number,
  type: 'subscription_revenue' | 'product_sale'
) {
  // Get affiliate program config
  const affiliateProgramDoc = await getDoc(doc(db, 'affiliate_programs', affiliateId))
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
  const monthsSinceReferral = differenceInMonths(new Date(), referral.data().subscriptionStartDate)

  if (program.recurringMonths && monthsSinceReferral >= program.recurringMonths) {
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

### Commission Payout System

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

  const totalPayout = commissionsSnap.docs.reduce((sum, doc) => sum + doc.data().amount, 0)

  // Minimum payout threshold (e.g., $50)
  if (totalPayout < 50) {
    console.log(`Payout for ${affiliateId} below minimum threshold: $${totalPayout}`)
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
    commissionsSnap.docs.forEach(doc => {
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

---

## 🛡️ Security & Access Control

### Firestore Rules for Subscriptions

```javascript
// user_subscriptions collection
match /user_subscriptions/{subscriptionId} {
  // Users can read their own subscription
  allow read: if isAuthenticated() && request.auth.uid == subscriptionId;

  // Only server (Admin SDK) can write
  allow write: if false;
}

// affiliate_commissions collection
match /affiliate_commissions/{commissionId} {
  // Affiliates can read their own commissions
  allow read: if isAuthenticated() &&
                 resource.data.affiliateId == request.auth.uid;

  // Only server can write
  allow write: if false;
}

// stripe_products collection
match /stripe_products/{productId} {
  // Anyone can read (to display pricing)
  allow read: if true;

  // Only admins can write
  allow write: if isAdmin();
}
```

### Middleware for Feature Access

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

## 📊 Admin Dashboard Requirements

### Subscription Management View
- List all subscriptions
- Filter by tier, status, role
- Search by user email/name
- View subscription details
- Cancel/refund subscriptions
- Apply discounts/coupons

### Affiliate Management View
- List all affiliates
- View referral stats (conversions, revenue)
- Approve/reject commissions
- Process payouts
- View commission history
- Generate referral links

### Revenue Analytics
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

## 🎛️ Feature Flag System

**Single Switch to Enable Payments:**

```typescript
// In Firebase Remote Config or Firestore
const FEATURE_FLAGS = {
  payments_enabled: false, // MASTER SWITCH
  free_trial_enabled: true,
  trial_days: 14,
  referral_program_enabled: false,
  product_affiliates_enabled: false,
  minimum_payout_threshold: 50,
  default_commission_rate: 0.20
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

---

## 📝 Environment Variables Needed

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

### Test Scenarios:

1. **Checkout Flow**
   - Successful payment
   - Failed payment
   - Canceled checkout
   - Trial period activation

2. **Subscription Lifecycle**
   - New subscription creation
   - Monthly renewal
   - Upgrade/downgrade
   - Cancellation
   - Reactivation

3. **Affiliate Tracking**
   - Referral link click → signup → conversion
   - Commission calculation
   - Multiple referrals from same affiliate
   - Commission payout

4. **Edge Cases**
   - Duplicate webhook events
   - Failed webhook delivery
   - Partial refunds
   - Subscription pausing
   - Payment method updates

### Stripe Test Cards:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Authentication: 4000 0025 0000 3155
```

---

## 💡 Key Decisions Needed Before Launch

1. **Pricing Structure**
   - [ ] Coach tier prices (Starter, Pro, Enterprise)
   - [ ] Athlete tier prices (Free, Premium)
   - [ ] One-time purchase prices (if applicable)
   - [ ] Free trial duration (14 days? 30 days?)

2. **Affiliate Program Terms**
   - [ ] Commission rate (% or fixed)
   - [ ] Recurring commission months (e.g., 12 months)
   - [ ] Minimum payout threshold ($50? $100?)
   - [ ] Payout frequency (monthly? quarterly?)

3. **Product Affiliate Strategy**
   - [ ] Which affiliate programs to integrate (Amazon, Nike, etc.)
   - [ ] Commission split (platform vs coach)
   - [ ] Product categories to support

4. **Refund/Cancellation Policy**
   - [ ] Refund window (30 days?)
   - [ ] Pro-rated refunds?
   - [ ] Cancel immediately vs at period end?

---

## 🎉 Ready to Launch Checklist

### When you have pricing figured out:

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

## 📚 Next Steps

1. **Review this plan** - Make sure it covers all your needs
2. **Define pricing** - Work out your tier structure and commission rates
3. **Create Stripe account** - Get test and live API keys
4. **Green light implementation** - When ready, we build this in phases

---

**This plan is implementation-ready.** Once you have your pricing structure, we can start building and have payments live within 2-3 weeks.

Questions? Let's refine this plan before implementation! 🎯
