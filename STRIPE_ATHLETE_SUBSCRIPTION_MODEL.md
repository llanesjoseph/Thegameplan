# GAMEPLAN STRIPE - ATHLETE SUBSCRIPTION MODEL (CORRECT)
**Timeline:** 2-3 days for testable MVP
**Last Updated:** November 9, 2025

---

## BUSINESS MODEL (CORRECT VERSION)

### How It Actually Works

```
SUBSCRIPTION FLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coach → Signs up → Creates content (FREE - no charge to coaches)
                         ↓
                  Coach builds lessons/videos
                         ↓
Athlete → Signs up → Gets assigned to Coach → Subscribes to tier
                                                    ↓
                            Athlete pays monthly ($0 for testing)
                                                    ↓
                    All money goes to YOUR Stripe account
                                                    ↓
              Athlete gets access based on tier (Basic or Elite)
                                                    ↓
              You pay coaches separately (manual payouts)
```

**Key Points:**
- ✅ **Coaches use platform for FREE**
- ✅ **Athletes pay subscriptions**
- ✅ **All money to one Stripe account (yours)**
- ✅ **Prices at $0 for now (testing)**
- ✅ **You pay coaches manually outside Stripe**

---

## TWO ATHLETE PRICING TIERS

### Tier 1: Basic Plan - $0/month (Testing - will be $29-49 later)
**What Athletes Get:**
- ✅ Access to coach's published lessons
- ✅ Video submission (limited to 2 per month)
- ✅ Basic video review feedback
- ✅ Progress tracking dashboard
- ✅ Email notifications

**Future Price:** $29-49/month
**Target Market:** Casual athletes, beginners, trying out coaching

---

### Tier 2: Elite Plan - $0/month (Testing - will be $79-99 later)
**What Athletes Get:**
- ✅ Everything in Basic, PLUS:
- ✅ **Unlimited video submissions**
- ✅ Priority review queue (faster feedback)
- ✅ AI Assistant access (ask coach 24/7)
- ✅ Access to coach's feed (premium content)
- ✅ Advanced analytics and progress reports
- ✅ Direct messaging with coach
- ✅ Group coaching sessions (if offered)

**Future Price:** $79-99/month
**Target Market:** Serious athletes, competitive players, committed training

---

## DATABASE SCHEMA

### Firestore Collections Update

**users collection (ATHLETES):**
```typescript
interface AthleteUser {
  // Existing fields...
  uid: string;
  email: string;
  role: 'athlete';
  displayName: string;
  coachId: string;  // Assigned coach

  // NEW: Subscription fields
  subscription: {
    tier: 'none' | 'basic' | 'elite';
    stripeCustomerId: string;        // 'cus_...'
    stripeSubscriptionId: string;    // 'sub_...'
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    currentPeriodEnd: Timestamp;
    cancelAtPeriodEnd: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };

  // Feature access based on tier
  access: {
    maxVideoSubmissions: number;      // 2 for basic, -1 (unlimited) for elite
    hasAIAssistant: boolean;          // false for basic, true for elite
    hasCoachFeed: boolean;            // false for basic, true for elite
    hasPriorityQueue: boolean;        // false for basic, true for elite
    hasDirectMessaging: boolean;      // false for basic, true for elite
  };
}
```

**users collection (COACHES) - NO SUBSCRIPTION NEEDED:**
```typescript
interface CoachUser {
  // Existing fields...
  uid: string;
  email: string;
  role: 'coach';
  displayName: string;

  // NO subscription field - coaches are FREE users
  // Platform tracks coach earnings separately

  // Optional: Track coach stats
  stats: {
    totalAthletes: number;
    activeSubscribers: number;
    totalEarnings: number;  // What you owe them
    lastPayoutDate?: Timestamp;
  };
}
```

**coach_payouts collection (NEW - for manual payouts):**
```typescript
interface CoachPayout {
  coachId: string;
  month: string;                    // '2025-11'
  activeAthletes: number;           // Count of subscribed athletes
  basicSubscribers: number;
  eliteSubscribers: number;
  totalEarned: number;              // Your calculation (e.g., $20 per athlete)
  paidOut: boolean;
  paidDate?: Timestamp;
  paymentMethod?: string;           // Venmo, Zelle, check, etc.
  notes?: string;
}
```

---

## IMPLEMENTATION PLAN (2-3 DAYS)

### DAY 1: Stripe Setup & Products (3-4 hours)

**Morning Tasks:**
- [ ] Create Stripe account (or use existing)
- [ ] Create 2 products for athletes
- [ ] Set prices to $0 for testing
- [ ] Install Stripe SDK: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
- [ ] Add environment variables

**Stripe Dashboard Setup:**

1. **Go to Stripe Dashboard → Products**
2. **Create Product 1: Athlete Basic**
   - Name: "GamePlan Basic"
   - Description: "Essential training access with your coach"
   - Pricing: **$0/month** (Recurring) ← SET TO ZERO FOR TESTING
   - Copy the Price ID: `price_XXXBASIC123`

3. **Create Product 2: Athlete Elite**
   - Name: "GamePlan Elite"
   - Description: "Premium training with unlimited access"
   - Pricing: **$0/month** (Recurring) ← SET TO ZERO FOR TESTING
   - Copy the Price ID: `price_XXXELITE456`

**Environment Variables:**
```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Athlete Subscription Price IDs
STRIPE_ATHLETE_BASIC_PRICE_ID=price_XXXBASIC123
STRIPE_ATHLETE_ELITE_PRICE_ID=price_XXXELITE456
```

**Afternoon: Database Schema Updates (3-4 hours)**

Create migration script to add subscription fields to existing athlete users:

```typescript
// scripts/add-subscription-schema.ts
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

async function addSubscriptionFields() {
  // Get all athletes
  const athletesSnap = await db.collection('users').where('role', '==', 'athlete').get();

  console.log(`Found ${athletesSnap.size} athletes`);

  for (const doc of athletesSnap.docs) {
    await doc.ref.update({
      subscription: {
        tier: 'none',
        status: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      access: {
        maxVideoSubmissions: 0,
        hasAIAssistant: false,
        hasCoachFeed: false,
        hasPriorityQueue: false,
        hasDirectMessaging: false,
      },
    });

    console.log(`✅ Updated ${doc.id}`);
  }

  console.log('Migration complete!');
}

addSubscriptionFields().catch(console.error);
```

Run migration:
```bash
npx tsx scripts/add-subscription-schema.ts
```

---

### DAY 2: Subscription Checkout for Athletes (6-8 hours)

**API Endpoint: Create Checkout Session**

**File:** `app/api/athlete/subscriptions/create-checkout/route.ts`
```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PRICE_IDS = {
  basic: process.env.STRIPE_ATHLETE_BASIC_PRICE_ID!,
  elite: process.env.STRIPE_ATHLETE_ELITE_PRICE_ID!,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier } = body; // 'basic' or 'elite'

    // 1. Verify authentication
    const token = request.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get athlete data
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'athlete') {
      return NextResponse.json({ error: 'Only athletes can subscribe' }, { status: 403 });
    }

    // 3. Check if already has active subscription
    if (userData.subscription?.status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // 4. Get or create Stripe customer
    let customerId = userData.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId,
          displayName: userData.displayName,
          role: 'athlete',
          coachId: userData.coachId || '',
        },
      });

      customerId = customer.id;

      await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customerId,
      });
    }

    // 5. Create Stripe Checkout Session
    const priceId = PRICE_IDS[tier as 'basic' | 'elite'];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete/pricing`,
      metadata: {
        userId,
        tier,
        role: 'athlete',
        coachId: userData.coachId || '',
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
          role: 'athlete',
          coachId: userData.coachId || '',
        },
        trial_period_days: 14, // Optional: 14-day free trial
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**Pricing Page for Athletes**

**File:** `app/dashboard/athlete/pricing/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Check, Star, Zap } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0, // Set to 0 for testing
    originalPrice: 39, // Show what it will be
    description: 'Essential training access with your coach',
    features: [
      'Access to all published lessons',
      '2 video submissions per month',
      'Video review feedback',
      'Progress tracking dashboard',
      'Email notifications',
      'Mobile app access',
    ],
    icon: Check,
    color: 'blue',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 0, // Set to 0 for testing
    originalPrice: 89, // Show what it will be
    description: 'Premium training for serious athletes',
    features: [
      'Everything in Basic, PLUS:',
      '✨ Unlimited video submissions',
      '⚡ Priority review queue',
      '🤖 AI coaching assistant 24/7',
      '📰 Access to coach\'s feed',
      '📊 Advanced analytics',
      '💬 Direct messaging with coach',
      '🏆 Early access to new features',
    ],
    popular: true,
    icon: Star,
    color: 'purple',
  },
];

export default function AthletePricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'basic' | 'elite') => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    setLoading(tier);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/athlete/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Training Plan
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Get personalized coaching from expert trainers
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            <Zap className="w-4 h-4" />
            TESTING MODE: All plans FREE right now!
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all hover:shadow-2xl ${
                  plan.popular ? 'ring-4 ring-purple-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-bold">
                    ⭐ MOST POPULAR
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.color === 'blue'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Regular price: ${plan.originalPrice}/month (coming soon)
                    </p>
                    <p className="text-sm text-green-600 font-semibold">
                      💚 FREE during testing phase
                    </p>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id as 'basic' | 'elite')}
                    disabled={loading === plan.id}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Loading...
                      </span>
                    ) : (
                      'Start Free Training'
                    )}
                  </button>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Why is everything free right now?
              </h3>
              <p className="text-gray-600">
                We're in testing mode! Help us perfect the platform and you'll get
                free access during this phase. Pricing will be activated later.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade anytime from your dashboard.
                Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                What's included in unlimited video submissions?
              </h3>
              <p className="text-gray-600">
                Elite members can submit as many videos as they want for coach
                review. Basic members are limited to 2 per month.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Do I need a credit card during testing?
              </h3>
              <p className="text-gray-600">
                Yes, but you won't be charged ($0/month). When we activate pricing
                later, you'll be notified 30 days in advance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### DAY 3: Webhooks & Access Control (6-8 hours)

**Webhook Handler**

**File:** `app/api/webhooks/stripe/route.ts`
```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const db = getFirestore();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(db, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(db, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(db, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(db, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(
  db: FirebaseFirestore.Firestore,
  session: Stripe.Checkout.Session
) {
  const { userId, tier, coachId } = session.metadata || {};

  if (!userId || !tier) {
    console.warn('Checkout session missing metadata:', session.id);
    return;
  }

  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Set access permissions based on tier
  const access =
    tier === 'elite'
      ? {
          maxVideoSubmissions: -1, // unlimited
          hasAIAssistant: true,
          hasCoachFeed: true,
          hasPriorityQueue: true,
          hasDirectMessaging: true,
        }
      : {
          maxVideoSubmissions: 2,
          hasAIAssistant: false,
          hasCoachFeed: false,
          hasPriorityQueue: false,
          hasDirectMessaging: false,
        };

  // Update athlete document
  await db.collection('users').doc(userId).update({
    'subscription.tier': tier,
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.status': subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    'subscription.updatedAt': new Date(),
    access,
  });

  // Update coach stats
  if (coachId) {
    await db.collection('users').doc(coachId).update({
      'stats.activeSubscribers': /* increment by 1 */,
      'stats.totalAthletes': /* increment by 1 if new */,
    });
  }

  console.log(`✅ Athlete ${userId} subscribed to ${tier} plan`);
}

async function handleSubscriptionUpdate(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const { userId } = subscription.metadata;

  if (!userId) {
    console.warn('Subscription missing userId:', subscription.id);
    return;
  }

  await db.collection('users').doc(userId).update({
    'subscription.status': subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    'subscription.updatedAt': new Date(),
  });

  console.log(`✅ Subscription updated for athlete ${userId}: ${subscription.status}`);
}

async function handleSubscriptionCanceled(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const { userId, coachId } = subscription.metadata;

  if (!userId) return;

  // Revoke access
  await db.collection('users').doc(userId).update({
    'subscription.tier': 'none',
    'subscription.status': 'canceled',
    'subscription.updatedAt': new Date(),
    access: {
      maxVideoSubmissions: 0,
      hasAIAssistant: false,
      hasCoachFeed: false,
      hasPriorityQueue: false,
      hasDirectMessaging: false,
    },
  });

  // Update coach stats
  if (coachId) {
    await db.collection('users').doc(coachId).update({
      'stats.activeSubscribers': /* decrement by 1 */,
    });
  }

  console.log(`✅ Subscription canceled for athlete ${userId}`);
}

async function handlePaymentFailed(
  db: FirebaseFirestore.Firestore,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  const usersRef = db.collection('users');
  const snapshot = await usersRef
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn('No user found for customer:', customerId);
    return;
  }

  const userId = snapshot.docs[0].id;

  await db.collection('users').doc(userId).update({
    'subscription.status': 'past_due',
    'subscription.updatedAt': new Date(),
  });

  console.log(`⚠️ Payment failed for athlete ${userId}`);
}
```

---

## ACCESS CONTROL / FEATURE GATING

**File:** `lib/athlete-access.ts`
```typescript
interface AthleteAccess {
  maxVideoSubmissions: number; // -1 = unlimited
  hasAIAssistant: boolean;
  hasCoachFeed: boolean;
  hasPriorityQueue: boolean;
  hasDirectMessaging: boolean;
}

export function canSubmitVideo(
  currentSubmissions: number,
  access: AthleteAccess
): { allowed: boolean; message?: string } {
  if (access.maxVideoSubmissions === -1) {
    return { allowed: true };
  }

  if (currentSubmissions >= access.maxVideoSubmissions) {
    return {
      allowed: false,
      message: `You've reached your video limit (${access.maxVideoSubmissions} per month). Upgrade to Elite for unlimited submissions.`,
    };
  }

  return { allowed: true };
}

export function canAccessAIAssistant(access: AthleteAccess): {
  allowed: boolean;
  message?: string;
} {
  if (!access.hasAIAssistant) {
    return {
      allowed: false,
      message: 'AI Assistant is only available on the Elite plan. Upgrade to get 24/7 coaching assistance.',
    };
  }

  return { allowed: true };
}

export function canAccessCoachFeed(access: AthleteAccess): {
  allowed: boolean;
  message?: string;
} {
  if (!access.hasCoachFeed) {
    return {
      allowed: false,
      message: "Coach's Feed is only available on the Elite plan.",
    };
  }

  return { allowed: true };
}
```

**Usage in Components:**
```tsx
// Example: Athlete tries to submit video
const userData = /* get from Firestore */;
const currentSubmissions = /* count this month's submissions */;

const accessCheck = canSubmitVideo(currentSubmissions, userData.access);

if (!accessCheck.allowed) {
  // Show upgrade prompt
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-800">{accessCheck.message}</p>
      <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg">
        Upgrade to Elite
      </button>
    </div>
  );
}

// Allow video submission...
```

---

## COACH EARNINGS TRACKING

Since you pay coaches manually, track what you owe them:

**File:** `lib/coach-earnings.ts`
```typescript
export async function trackCoachEarnings(
  db: FirebaseFirestore.Firestore,
  coachId: string,
  tier: 'basic' | 'elite',
  action: 'add' | 'remove'
) {
  const month = new Date().toISOString().slice(0, 7); // '2025-11'
  const payoutRef = db.collection('coach_payouts').doc(`${coachId}_${month}`);

  const doc = await payoutRef.get();
  const currentData = doc.data() || {
    coachId,
    month,
    basicSubscribers: 0,
    eliteSubscribers: 0,
    totalEarned: 0,
    paidOut: false,
  };

  // Your revenue share calculation (example: you keep 30%, coach gets 70%)
  const rates = {
    basic: 39 * 0.7,  // Coach gets $27.30 per basic subscriber
    elite: 89 * 0.7,  // Coach gets $62.30 per elite subscriber
  };

  if (action === 'add') {
    currentData[`${tier}Subscribers`] += 1;
    currentData.totalEarned += rates[tier];
  } else {
    currentData[`${tier}Subscribers`] -= 1;
    currentData.totalEarned -= rates[tier];
  }

  await payoutRef.set(currentData, { merge: true });
}
```

---

## TESTING CHECKLIST

### Athlete Subscription Flow
- [ ] Athlete clicks "Start Free Training"
- [ ] Redirects to Stripe Checkout
- [ ] Enters test card: 4242 4242 4242 4242
- [ ] Completes checkout (charges $0)
- [ ] Webhook fires: checkout.session.completed
- [ ] Database updates with subscription
- [ ] Athlete tier set correctly (basic or elite)
- [ ] Access permissions granted
- [ ] Redirected to success page

### Feature Access
- [ ] Basic athlete tries AI Assistant → blocked
- [ ] Elite athlete accesses AI Assistant → allowed
- [ ] Basic athlete submits 3rd video → blocked
- [ ] Elite athlete submits unlimited videos → allowed
- [ ] Basic athlete tries coach feed → blocked
- [ ] Elite athlete accesses coach feed → allowed

### Upgrade Flow
- [ ] Basic athlete clicks "Upgrade to Elite"
- [ ] Completes upgrade checkout
- [ ] Access instantly updated to elite features
- [ ] No double charging

### Cancellation
- [ ] Athlete cancels subscription
- [ ] Access continues until period end
- [ ] After period end, all access revoked
- [ ] Can resubscribe later

---

## REVENUE CALCULATIONS

**Example with 100 athletes:**
- 60 on Basic ($39/month) = $2,340/month
- 40 on Elite ($89/month) = $3,560/month
- **Total Revenue: $5,900/month**

**After Stripe Fees (2.9% + $0.30):**
- Net Revenue: ~$5,650/month

**If you pay coaches 70%:**
- Coach payouts: ~$3,955/month
- **Your profit: ~$1,695/month**

---

## UPDATING PRICES LATER

When ready to activate real pricing:

1. Go to Stripe Dashboard → Products
2. Click on each product
3. Add new price (e.g., $39/month, $89/month)
4. Copy new Price IDs
5. Update environment variables
6. Notify existing $0 subscribers 30 days in advance
7. Switch them to new prices (Stripe handles this)

---

## KEY DIFFERENCES FROM PREVIOUS VERSION

❌ **NOT** charging coaches
✅ **CHARGING** athletes for subscriptions

❌ **NOT** Stripe Connect
✅ **SIMPLE** Stripe Subscriptions

❌ **NOT** automated coach payouts
✅ **MANUAL** coach payouts (you track separately)

❌ **NOT** split payments
✅ **ALL** money to your account

---

Ready to start building? I can create the API endpoints first so you can test the checkout flow in a few hours!
