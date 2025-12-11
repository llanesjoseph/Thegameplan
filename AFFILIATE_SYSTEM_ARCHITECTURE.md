# 🤝 Affiliate System Architecture - Complete Blueprint

**Date:** 2025-10-13
**Purpose:** Detailed architecture for two-tier affiliate/kickback system

---

## 🎯 Two Affiliate Systems

### System 1: User Referral Program
**Who:** Coaches/Athletes refer other users to the platform
**Revenue Source:** Subscription fees from referred users
**Commission:** % of subscription revenue (recurring)

### System 2: Product/Gear Affiliate Links
**Who:** Coaches recommend products/gear in lessons
**Revenue Source:** Product sales via affiliate links
**Commission:** % of product sale (one-time or recurring)

---

## 📊 System 1: User Referral Program

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
│ STEP 3: Coach B Signs Up                               │
├─────────────────────────────────────────────────────────┤
│ Signup form auto-fills referral code                   │
│ OR: User manually enters code                          │
│ Validation: Check if code exists and is active         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Coach B Selects Plan & Pays                    │
├─────────────────────────────────────────────────────────┤
│ Stripe checkout session includes metadata:             │
│ { referredBy: "coach-a-uid", referralCode: "..." }     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Webhook Creates Referral Record                │
├─────────────────────────────────────────────────────────┤
│ affiliate_referrals collection:                         │
│ - affiliateId: coach-a-uid                              │
│ - referredUserId: coach-b-uid                           │
│ - subscriptionId: sub_xyz                               │
│ - status: "active"                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Monthly Billing Creates Commission             │
├─────────────────────────────────────────────────────────┤
│ Every month when Coach B is billed:                    │
│ - Calculate commission (e.g., 20% of $29 = $5.80)      │
│ - Create commission record                              │
│ - Add to Coach A's pending balance                     │
│ - Continue for X months (e.g., 12)                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 7: Monthly Payout Processing                      │
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

---

## 📦 System 2: Product/Gear Affiliate Links

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
  productCategory: 'gear' | 'equipment' | 'apparel' | 'supplements' | 'books'

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

---

## 🔐 Fraud Detection & Prevention

### Fraud Signals to Monitor

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

async function assessFraudRisk(referral: AffiliateReferral): Promise<number> {
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

  if (referrerDomain === referredDomain && !['gmail.com', 'yahoo.com', 'outlook.com'].includes(referrerDomain)) {
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

## 📊 Affiliate Dashboard UI Components

### 1. Affiliate Overview Card
```
┌────────────────────────────────────────────┐
│ Your Referral Stats                        │
├────────────────────────────────────────────┤
│ Total Referrals       │ 25                 │
│ Active Subscriptions  │ 18                 │
│ Conversion Rate       │ 72%                │
│                                             │
│ Earnings This Month   │ $234.50            │
│ Total Earnings        │ $1,890.00          │
│ Pending Payout        │ $87.20             │
│                                             │
│ [Request Payout →]                         │
└────────────────────────────────────────────┘
```

### 2. Referral Link Generator
```
┌────────────────────────────────────────────┐
│ Your Referral Link                         │
├────────────────────────────────────────────┤
│ https://athleap.com/signup?ref=JOHN-XYZ   │
│ [Copy Link] [Share via Email] [QR Code]   │
│                                             │
│ Custom Code (optional)                     │
│ [CoachJohn2024___________] [Update]       │
└────────────────────────────────────────────┘
```

### 3. Referral History Table
```
┌───────────────────────────────────────────────────────────────┐
│ Name          │ Joined      │ Plan    │ Status    │ Earned   │
├───────────────────────────────────────────────────────────────┤
│ Mike Smith    │ Jan 15      │ Pro     │ Active    │ $58.00   │
│ Sarah Jones   │ Jan 12      │ Starter │ Active    │ $34.80   │
│ Tom Wilson    │ Dec 28      │ Pro     │ Canceled  │ $116.00  │
└───────────────────────────────────────────────────────────────┘
```

### 4. Commission Timeline
```
┌────────────────────────────────────────────┐
│ Recent Commissions                         │
├────────────────────────────────────────────┤
│ ⚫ Today          │ +$5.80   │ Mike Smith │
│ ⚫ 2 days ago     │ +$5.80   │ Sarah Jones│
│ ⚫ 5 days ago     │ +$5.80   │ Mike Smith │
│ ⚪ Jan 15        │ $87.20   │ PAYOUT     │
└────────────────────────────────────────────┘
```

---

## 🎛️ Admin Controls

### Commission Approval Workflow
```typescript
// Admin reviews pending commissions
GET /api/admin/affiliate/pending-commissions

// Admin approves commission
POST /api/admin/affiliate/approve-commission
Request: { commissionId: string }

// Admin rejects commission (fraud, TOS violation, etc.)
POST /api/admin/affiliate/reject-commission
Request: {
  commissionId: string
  reason: string
}

// Bulk approve all pending
POST /api/admin/affiliate/bulk-approve
Request: { commissionIds: string[] }
```

### Performance Tier Management
```typescript
// Automatically upgrade affiliates based on performance
async function updateAffiliateTiers() {
  const affiliates = await getDocs(collection(db, 'affiliate_programs'))

  for (const affiliate of affiliates.docs) {
    const data = affiliate.data()

    // Tier thresholds
    if (data.totalConversions >= 50) {
      // Platinum: 50+ conversions
      await updateDoc(affiliate.ref, {
        tier: 'platinum',
        commissionRate: 0.25 // 25% instead of 20%
      })
    } else if (data.totalConversions >= 20) {
      // Gold: 20+ conversions
      await updateDoc(affiliate.ref, {
        tier: 'gold',
        commissionRate: 0.22
      })
    } else if (data.totalConversions >= 10) {
      // Silver: 10+ conversions
      await updateDoc(affiliate.ref, {
        tier: 'silver',
        commissionRate: 0.21
      })
    }
  }
}
```

---

## 🚀 Implementation Priority

### Phase 1: User Referral System (CRITICAL)
1. Referral code generation
2. Click tracking & cookie management
3. Referral attribution in checkout
4. Commission calculation engine
5. Affiliate dashboard UI

### Phase 2: Payout System
1. Stripe Connect onboarding
2. Automated payout processing
3. Manual payout tools (PayPal, etc.)
4. Payout history & reporting

### Phase 3: Product Affiliates
1. Amazon Associates integration
2. Product link generator
3. Click tracking & redirect
4. Commission import & attribution

### Phase 4: Advanced Features
1. Fraud detection system
2. Performance tiers
3. Admin approval workflow
4. Analytics & reporting

---

## ✅ Ready to Build

This affiliate system is designed to scale from day one. When you're ready:
1. Decide commission rates
2. Choose payout frequency
3. Set minimum thresholds
4. Enable feature flag
5. Launch! 🚀
