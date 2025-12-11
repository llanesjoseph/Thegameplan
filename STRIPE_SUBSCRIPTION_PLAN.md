# GAMEPLAN STRIPE SUBSCRIPTION MODEL - SIMPLIFIED
**Timeline:** 2-3 days for testable MVP
**Last Updated:** November 9, 2025

---

## BUSINESS MODEL (CORRECTED)

### How It Actually Works

```
SUBSCRIPTION FLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coach → Signs up → Chooses Tier (Basic or Premium)
                         ↓
            Pays monthly subscription to PLATFORM
                         ↓
        All money goes to ONE Stripe account (yours)
                         ↓
          Platform provides coaching tools/features
                         ↓
    Platform pays coaches separately (manual payouts)
```

**No Stripe Connect needed!** This is a standard SaaS subscription model.

---

## TWO PRICING TIERS

### Tier 1: Basic Plan - $29/month
**What Coaches Get:**
- ✅ Video Review Queue (up to 10 athletes)
- ✅ Basic Lesson Manager (up to 20 lessons)
- ✅ Video Library (5GB storage)
- ✅ Basic Analytics Dashboard
- ✅ Email Support

**Target Market:** Part-time coaches, beginners, testing the platform

---

### Tier 2: Premium Plan - $99/month
**What Coaches Get:**
- ✅ Everything in Basic, PLUS:
- ✅ Unlimited Athletes
- ✅ Unlimited Lessons
- ✅ Video Library (50GB storage)
- ✅ Advanced Analytics & Reporting
- ✅ AI Assistant for Coaching
- ✅ Coach's Feed (content publishing)
- ✅ Priority Support
- ✅ White-label Branding Options

**Target Market:** Professional coaches, established coaching businesses

---

## IMPLEMENTATION PLAN (2-3 DAYS)

### DAY 1: Stripe Setup & Product Configuration (3-4 hours)

**Morning Tasks:**
- [ ] Create Stripe account (or use existing)
- [ ] Create 2 products in Stripe Dashboard
- [ ] Get API keys (test mode): `sk_test_...` and `pk_test_...`
- [ ] Install Stripe SDK: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
- [ ] Add environment variables

**Stripe Dashboard Setup:**

1. **Go to Stripe Dashboard → Products**
2. **Create Product 1: Basic Plan**
   - Name: "Athleap Basic"
   - Description: "Essential coaching tools for up to 10 athletes"
   - Pricing: $29/month (Recurring)
   - Copy the Price ID: `price_XXXBASIC123` (you'll need this)

3. **Create Product 2: Premium Plan**
   - Name: "Athleap Premium"
   - Description: "Full-featured coaching platform with unlimited athletes"
   - Pricing: $99/month (Recurring)
   - Copy the Price ID: `price_XXXPREMIUM456` (you'll need this)

**Environment Variables:**
```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get this after setting up webhooks)

# Price IDs from Stripe Dashboard
STRIPE_BASIC_PRICE_ID=price_XXXBASIC123
STRIPE_PREMIUM_PRICE_ID=price_XXXPREMIUM456
```

**Afternoon: Database Schema (3-4 hours)**

Update Firestore schema to track subscriptions:

```typescript
// users collection (coaches)
interface CoachUser {
  // Existing fields...
  email: string;
  role: 'coach';
  displayName: string;

  // NEW: Subscription fields
  subscription: {
    tier: 'none' | 'basic' | 'premium';
    stripeCustomerId: string;        // 'cus_...'
    stripeSubscriptionId: string;    // 'sub_...'
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    currentPeriodEnd: Timestamp;
    cancelAtPeriodEnd: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };

  // Feature limits based on tier
  limits: {
    maxAthletes: number;      // 10 for basic, unlimited for premium
    maxLessons: number;       // 20 for basic, unlimited for premium
    storageGB: number;        // 5 for basic, 50 for premium
  };
}
```

---

### DAY 2: Subscription Creation & Checkout (6-8 hours)

**Morning: API Endpoints**

**File:** `app/api/subscriptions/create-checkout/route.ts`
```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier } = body; // 'basic' or 'premium'

    // 1. Verify authentication
    const token = request.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get user data
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can subscribe' }, { status: 403 });
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
          role: 'coach',
        },
      });

      customerId = customer.id;

      await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customerId,
      });
    }

    // 5. Create Stripe Checkout Session
    const priceId = PRICE_IDS[tier as 'basic' | 'premium'];

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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/coach/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/coach/pricing`,
      metadata: {
        userId,
        tier,
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
        },
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

**Afternoon: Pricing Page UI**

**File:** `app/dashboard/coach/pricing/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Check } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    description: 'Perfect for part-time coaches starting out',
    features: [
      'Up to 10 athletes',
      'Up to 20 lessons',
      '5GB video storage',
      'Video review queue',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    description: 'Full-featured platform for professional coaches',
    features: [
      'Unlimited athletes',
      'Unlimited lessons',
      '50GB video storage',
      'Video review queue',
      'Advanced analytics',
      'AI coaching assistant',
      "Coach's feed publishing",
      'Priority support',
      'White-label branding',
    ],
    popular: true,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'basic' | 'premium') => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    setLoading(tier);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscriptions/create-checkout', {
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start with 14 days free. Cancel anytime.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id as 'basic' | 'premium')}
                  disabled={loading === plan.id}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? 'Loading...' : 'Start Free Trial'}
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
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
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
                What happens after the trial?
              </h3>
              <p className="text-gray-600">
                After 14 days, you'll be charged for your chosen plan. You can
                cancel anytime during the trial with no charge.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Do athletes pay separately?
              </h3>
              <p className="text-gray-600">
                No. Your subscription covers the platform for you and all your
                athletes. You can charge athletes separately for your coaching
                services.
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

### DAY 3: Webhooks & Subscription Management (6-8 hours)

**Morning: Webhook Handler**

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

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const db = getFirestore();

    // Handle events
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
        await handlePaymentSuccess(db, invoice);
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
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(
  db: FirebaseFirestore.Firestore,
  session: Stripe.Checkout.Session
) {
  const { userId, tier } = session.metadata || {};

  if (!userId || !tier) {
    console.warn('Checkout session missing metadata:', session.id);
    return;
  }

  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Set limits based on tier
  const limits =
    tier === 'premium'
      ? {
          maxAthletes: -1, // unlimited
          maxLessons: -1, // unlimited
          storageGB: 50,
        }
      : {
          maxAthletes: 10,
          maxLessons: 20,
          storageGB: 5,
        };

  // Update user document
  await db.collection('users').doc(userId).update({
    'subscription.tier': tier,
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.status': subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    'subscription.updatedAt': new Date(),
    limits,
  });

  console.log(`✅ Checkout completed for user ${userId} - ${tier} plan`);
}

async function handleSubscriptionUpdate(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const { userId, tier } = subscription.metadata;

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

  console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionCanceled(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const { userId } = subscription.metadata;

  if (!userId) return;

  // Downgrade to free tier limits
  await db.collection('users').doc(userId).update({
    'subscription.tier': 'none',
    'subscription.status': 'canceled',
    'subscription.updatedAt': new Date(),
    limits: {
      maxAthletes: 0,
      maxLessons: 0,
      storageGB: 0,
    },
  });

  console.log(`✅ Subscription canceled for user ${userId}`);
}

async function handlePaymentSuccess(
  db: FirebaseFirestore.Firestore,
  invoice: Stripe.Invoice
) {
  console.log(`✅ Payment succeeded: ${invoice.id}`);
  // Optional: Log transaction, send receipt email, etc.
}

async function handlePaymentFailed(
  db: FirebaseFirestore.Firestore,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  // Find user by customerId
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

  // Update status to past_due
  await db.collection('users').doc(userId).update({
    'subscription.status': 'past_due',
    'subscription.updatedAt': new Date(),
  });

  console.log(`⚠️ Payment failed for user ${userId}`);
  // TODO: Send email notification to update payment method
}
```

**Afternoon: Customer Portal & Subscription Management**

**File:** `app/api/subscriptions/portal/route.ts`
```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
    const token = request.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get user data
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // 3. Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/coach`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

**UI Component: Manage Subscription Button**

```tsx
// components/coach/ManageSubscriptionButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function ManageSubscriptionButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Portal error:', error);
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  );
}
```

---

## TESTING STRATEGY

### Test Cards (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | 3D Secure required |

**CVC:** Any 3 digits
**Expiry:** Any future date
**ZIP:** Any 5 digits

### Test Scenarios Checklist

#### Subscription Creation
- [ ] Coach selects Basic plan
- [ ] Redirects to Stripe Checkout
- [ ] Enters test card: 4242 4242 4242 4242
- [ ] Completes checkout
- [ ] Webhook fires: checkout.session.completed
- [ ] Database updates with subscription data
- [ ] Coach tier set to 'basic'
- [ ] Limits applied (10 athletes, 20 lessons, 5GB)
- [ ] Coach redirected to success page

#### Subscription Upgrade
- [ ] Coach with Basic plan clicks "Upgrade"
- [ ] Selects Premium plan
- [ ] Payment succeeds
- [ ] Tier upgraded to 'premium'
- [ ] Limits updated (unlimited)
- [ ] Prorated charge calculated correctly

#### Payment Failures
- [ ] Test with declined card: 4000 0000 0000 0002
- [ ] Webhook fires: invoice.payment_failed
- [ ] Subscription status → 'past_due'
- [ ] Coach receives notification to update card
- [ ] Access limited after grace period

#### Cancellation
- [ ] Coach clicks "Manage Subscription"
- [ ] Opens Stripe Customer Portal
- [ ] Cancels subscription
- [ ] Webhook fires: customer.subscription.deleted
- [ ] Access continues until period end
- [ ] After period end, downgrade to free tier
- [ ] Features disabled based on limits

---

## FEATURE GATING LOGIC

### Enforcing Tier Limits

**File:** `lib/subscription-limits.ts`
```typescript
interface SubscriptionLimits {
  maxAthletes: number; // -1 = unlimited
  maxLessons: number;
  storageGB: number;
}

export function checkAthleteLimit(
  currentCount: number,
  limits: SubscriptionLimits
): { allowed: boolean; message?: string } {
  if (limits.maxAthletes === -1) {
    return { allowed: true };
  }

  if (currentCount >= limits.maxAthletes) {
    return {
      allowed: false,
      message: `You've reached your athlete limit (${limits.maxAthletes}). Upgrade to Premium for unlimited athletes.`,
    };
  }

  return { allowed: true };
}

export function checkLessonLimit(
  currentCount: number,
  limits: SubscriptionLimits
): { allowed: boolean; message?: string } {
  if (limits.maxLessons === -1) {
    return { allowed: true };
  }

  if (currentCount >= limits.maxLessons) {
    return {
      allowed: false,
      message: `You've reached your lesson limit (${limits.maxLessons}). Upgrade to Premium for unlimited lessons.`,
    };
  }

  return { allowed: true };
}

export function checkStorageLimit(
  currentGB: number,
  limits: SubscriptionLimits
): { allowed: boolean; message?: string } {
  if (currentGB >= limits.storageGB) {
    return {
      allowed: false,
      message: `You've reached your storage limit (${limits.storageGB}GB). Upgrade to increase storage.`,
    };
  }

  return { allowed: true };
}
```

**Usage in API:**
```typescript
// Example: Before adding new athlete
const userDoc = await db.collection('users').doc(coachId).get();
const userData = userDoc.data();

const athleteCount = /* get current count */;
const limitCheck = checkAthleteLimit(athleteCount, userData.limits);

if (!limitCheck.allowed) {
  return NextResponse.json(
    { error: limitCheck.message },
    { status: 403 }
  );
}

// Proceed with adding athlete...
```

---

## COACH PAYOUT TRACKING

Since you're paying coaches manually, you need a way to track what you owe them.

**File:** `lib/coach-payouts.ts`
```typescript
interface CoachPayout {
  coachId: string;
  month: string; // '2025-11'
  videoReviewsCompleted: number;
  totalEarned: number; // Calculate based on your commission split
  paidOut: boolean;
  paidDate?: Date;
}

// Example: Track earnings per coach
export async function recordCoachEarnings(
  db: FirebaseFirestore.Firestore,
  coachId: string,
  amount: number
) {
  const month = new Date().toISOString().slice(0, 7); // '2025-11'
  const payoutRef = db.collection('coach_payouts').doc(`${coachId}_${month}`);

  await payoutRef.set(
    {
      coachId,
      month,
      videoReviewsCompleted: /* increment */,
      totalEarned: /* increment by amount */,
      paidOut: false,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

// Admin function: Get unpaid coaches
export async function getUnpaidCoaches(db: FirebaseFirestore.Firestore) {
  const snapshot = await db
    .collection('coach_payouts')
    .where('paidOut', '==', false)
    .get();

  return snapshot.docs.map((doc) => doc.data());
}
```

---

## REVENUE CALCULATIONS

### Monthly Recurring Revenue (MRR)

```typescript
// Example calculation
const basicCoaches = 50; // coaches on $29/month
const premiumCoaches = 20; // coaches on $99/month

const mrr = (basicCoaches * 29) + (premiumCoaches * 99);
// = $1,450 + $1,980 = $3,430/month

// Annual Run Rate (ARR)
const arr = mrr * 12; // = $41,160/year
```

### Cost Structure

**Stripe Fees:**
- Card processing: 2.9% + $0.30 per transaction
- Monthly subscription of $29: Fee = $1.14
- Monthly subscription of $99: Fee = $3.17

**Your Net Revenue:**
- Basic: $29 - $1.14 = **$27.86 per coach**
- Premium: $99 - $3.17 = **$95.83 per coach**

---

## WEBHOOK SETUP

1. **Go to Stripe Dashboard → Developers → Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe`
4. **Select events:**
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed

5. **Copy webhook signing secret:** `whsec_...`
6. **Add to `.env.local`:** `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## GO-LIVE CHECKLIST

### Pre-Production
- [ ] Test Basic subscription flow
- [ ] Test Premium subscription flow
- [ ] Test subscription cancellation
- [ ] Test failed payment handling
- [ ] Verify webhooks fire correctly
- [ ] Test feature gating (limits)
- [ ] Test upgrade/downgrade
- [ ] Verify database updates

### Production Setup
- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure production webhook secret
- [ ] Enable Stripe Radar (fraud detection)
- [ ] Set up billing alerts
- [ ] Test with real card (refund after)
- [ ] Configure invoice settings in Stripe
- [ ] Set up subscription notifications

### Legal
- [ ] Update Terms of Service (mention subscription)
- [ ] Update Privacy Policy (Stripe data)
- [ ] Display cancellation policy clearly
- [ ] Provide subscription receipt/invoices
- [ ] Tax compliance (if applicable)

---

## TIMELINE SUMMARY

**Day 1:** Stripe setup, products, database schema (3-4 hours)
**Day 2:** Checkout flow, pricing page UI (6-8 hours)
**Day 3:** Webhooks, portal, testing (6-8 hours)

**Total:** 15-20 hours = **2-3 full days**

---

## NEXT STEPS

After MVP is working:
1. Add trial period (14 days free)
2. Implement promo codes
3. Build admin revenue dashboard
4. Add usage analytics per tier
5. Email notifications (payment failed, trial ending, etc.)
6. Yearly plans with discount (save 20%)

---

This is **MUCH simpler** than the marketplace model. You just need:
- ✅ Standard Stripe Subscriptions
- ✅ 2 pricing tiers
- ✅ Feature gating based on tier
- ✅ Webhooks to update database

No Stripe Connect, no split payments, no complex payouts!

Ready to start building? Want me to generate any specific code files first?
