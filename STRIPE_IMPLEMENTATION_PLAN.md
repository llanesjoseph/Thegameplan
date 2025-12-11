# GAMEPLAN STRIPE IMPLEMENTATION - COMPLETE GUIDE
**Timeline:** 3-5 days for testable MVP
**Last Updated:** November 9, 2025

---

## TABLE OF CONTENTS
1. [Business Model & Payment Flows](#business-model--payment-flows)
2. [Stripe Architecture Overview](#stripe-architecture-overview)
3. [Required Stripe Products](#required-stripe-products)
4. [Implementation Roadmap (3-5 Days)](#implementation-roadmap-3-5-days)
5. [Database Schema Changes](#database-schema-changes)
6. [API Endpoints to Build](#api-endpoints-to-build)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing Strategy](#testing-strategy)
9. [Security Checklist](#security-checklist)
10. [Go-Live Checklist](#go-live-checklist)

---

## BUSINESS MODEL & PAYMENT FLOWS

### Revenue Model Options

**Option A: Platform Percentage (Recommended)**
- Athletes pay platform directly
- Platform takes 20% commission
- Coach receives 80% payout
- Example: Athlete pays $50 → Coach gets $40, Platform gets $10

**Option B: Coach Sets Prices + Platform Fee**
- Coach sets their own rates
- Platform adds fixed fee on top (e.g., +$5 per transaction)
- Example: Coach charges $50 → Athlete pays $55 ($5 to platform)

**Option C: Subscription Tiers**
- Athletes subscribe monthly to access coach's content
- Platform takes 15-20% of subscription revenue
- Example: $99/month subscription → Coach gets $79-84, Platform gets $15-20

### Payment Flows to Implement

```
FLOW 1: One-Time Video Review Purchase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Athlete → Selects Coach → Submits Video → Pays $50
                                              ↓
                            Stripe processes payment
                                              ↓
                    Platform holds funds (application_fee)
                                              ↓
              Coach completes review → Platform releases payout
                                              ↓
                        Coach receives $40 (80%)
                    Platform keeps $10 (20%)

FLOW 2: Monthly Lesson Subscription
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Athlete → Subscribes to Coach's Lessons → Pays $99/month
                                              ↓
                        Stripe creates subscription
                                              ↓
                        Auto-charges every month
                                              ↓
                Platform takes 20% ($19.80/month)
              Coach receives 80% ($79.20/month)

FLOW 3: Coach Onboarding & Payout Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coach → Signs up → Completes Stripe Connect Onboarding
                                              ↓
                    Links bank account via Stripe
                                              ↓
                Platform verifies identity (Stripe handles)
                                              ↓
            Coach can receive payouts (auto every 2-7 days)
```

---

## STRIPE ARCHITECTURE OVERVIEW

### Products You Need

| Stripe Product | Purpose | Cost | Priority |
|----------------|---------|------|----------|
| **Stripe Connect** | Marketplace payments (coach payouts) | 0.25% + standard fees | **CRITICAL** |
| **Payment Intents API** | One-time payments (video reviews) | 2.9% + $0.30 | **CRITICAL** |
| **Subscriptions** | Recurring monthly lesson access | 2.9% + $0.30 | **HIGH** |
| **Customer Portal** | Athletes manage subscriptions | Free | **MEDIUM** |
| **Webhooks** | Payment event handling | Free | **CRITICAL** |
| **Stripe Checkout** | Hosted payment page (optional) | Same as above | **OPTIONAL** |

### Architecture Pattern: Stripe Connect Platform

```
┌─────────────────────────────────────────────────────────────┐
│                    GAMEPLAN PLATFORM                         │
│                  (Your Stripe Account)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Platform Commission Account               │    │
│  │         (Receives 20% of all payments)             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Coach A    │   │   Coach B    │   │   Coach C    │
│ (Connected   │   │ (Connected   │   │ (Connected   │
│  Account)    │   │  Account)    │   │  Account)    │
│              │   │              │   │              │
│ Receives 80% │   │ Receives 80% │   │ Receives 80% │
└──────────────┘   └──────────────┘   └──────────────┘
```

**Key Concept:** You create a Stripe Connect "Standard Account" for each coach, allowing them to receive payouts directly to their bank while you take a commission.

---

## REQUIRED STRIPE PRODUCTS

### 1. Stripe Connect (Express Accounts) - CRITICAL

**What it does:**
- Creates separate Stripe accounts for each coach
- Handles coach onboarding, identity verification, tax forms
- Enables you to take platform commission automatically
- Manages payouts to coaches' bank accounts

**Why Express Accounts:**
- ✅ Simplest implementation (Stripe handles onboarding UI)
- ✅ Stripe handles compliance (KYC, AML, tax reporting)
- ✅ Coach sees "Powered by Stripe" branding (not your platform)
- ✅ Platform not liable for coach chargebacks

**Implementation:**
```javascript
// Create Express account for coach
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: coach.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: 'individual', // or 'company'
  metadata: {
    coachId: coach.uid,
    displayName: coach.displayName,
  }
});

// Generate onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://yourdomain.com/coach/onboarding/refresh',
  return_url: 'https://yourdomain.com/coach/onboarding/complete',
  type: 'account_onboarding',
});

// Redirect coach to accountLink.url
```

### 2. Payment Intents API - CRITICAL

**What it does:**
- Securely accepts one-time payments (video reviews)
- Handles 3D Secure authentication automatically
- Supports application fees (your commission)

**Implementation:**
```javascript
// Create payment for video review
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  customer: athleteStripeCustomerId,
  application_fee_amount: 1000, // Platform keeps $10 (20%)
  transfer_data: {
    destination: coachStripeAccountId, // Coach receives $40
  },
  metadata: {
    athleteId: athlete.uid,
    coachId: coach.uid,
    submissionId: submission.id,
    type: 'video_review',
  },
  description: 'Video Review - Baseball Pitching Mechanics',
});

// Return client_secret to frontend for confirmation
return { clientSecret: paymentIntent.client_secret };
```

**Frontend (React):**
```jsx
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLIC_KEY');

function VideoReviewPayment({ clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
```

### 3. Subscriptions API - HIGH PRIORITY

**What it does:**
- Recurring monthly billing for lesson access
- Automatic retry on failed payments
- Prorated upgrades/downgrades
- Application fees for platform commission

**Implementation:**
```javascript
// Create subscription for lesson access
const subscription = await stripe.subscriptions.create({
  customer: athleteStripeCustomerId,
  items: [
    {
      price: 'price_LESSON_PLAN_99', // Created in Stripe Dashboard
    },
  ],
  application_fee_percent: 20, // Platform takes 20%
  transfer_data: {
    destination: coachStripeAccountId,
  },
  metadata: {
    athleteId: athlete.uid,
    coachId: coach.uid,
    planType: 'monthly_lessons',
  },
});
```

### 4. Customer Portal - MEDIUM PRIORITY

**What it does:**
- Hosted UI for athletes to manage subscriptions
- Update payment methods
- View invoices and payment history
- Cancel subscriptions

**Implementation:**
```javascript
// Generate portal session
const session = await stripe.billingPortal.sessions.create({
  customer: athleteStripeCustomerId,
  return_url: 'https://yourdomain.com/dashboard/athlete',
});

// Redirect to session.url
```

---

## IMPLEMENTATION ROADMAP (3-5 Days)

### DAY 1: Stripe Setup & Database Schema

**Morning (2-3 hours):**
- [ ] Create Stripe account (or use existing)
- [ ] Enable Stripe Connect in dashboard
- [ ] Get API keys (test mode): `sk_test_...` and `pk_test_...`
- [ ] Install Stripe SDK: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
- [ ] Set environment variables in `.env.local`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

**Afternoon (3-4 hours):**
- [ ] Update Firestore schema (add Stripe fields to users collection)
- [ ] Create `stripe` utility file (`lib/stripe.server.ts`)
- [ ] Build coach onboarding API endpoint (`/api/coach/stripe/onboard`)
- [ ] Build coach onboarding UI flow

**Firestore Schema Updates:**
```typescript
// users collection (coaches)
interface CoachUser {
  // Existing fields...
  stripe: {
    accountId: string;          // 'acct_...'
    accountStatus: 'pending' | 'active' | 'restricted';
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    lastUpdated: Timestamp;
  };
}

// users collection (athletes)
interface AthleteUser {
  // Existing fields...
  stripe: {
    customerId: string;         // 'cus_...'
    paymentMethods: string[];   // ['pm_...']
    subscriptions: {
      [coachId: string]: {
        subscriptionId: string; // 'sub_...'
        status: 'active' | 'canceled' | 'past_due';
        currentPeriodEnd: Timestamp;
      };
    };
  };
}
```

### DAY 2: Coach Stripe Connect Onboarding

**Tasks (6-8 hours):**
- [ ] Build `/api/coach/stripe/onboard` endpoint
- [ ] Build `/api/coach/stripe/onboard-refresh` endpoint
- [ ] Build `/api/coach/stripe/account-status` endpoint
- [ ] Create coach onboarding UI component
- [ ] Add "Connect Stripe" button to coach dashboard
- [ ] Handle onboarding redirect flows
- [ ] Test with multiple coach accounts

**API Implementation:**

```typescript
// app/api/coach/stripe/onboard/route.ts
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

    // 2. Get coach data
    const db = getFirestore();
    const coachDoc = await db.collection('users').doc(userId).get();
    const coachData = coachDoc.data();

    if (!coachData || coachData.role !== 'coach') {
      return NextResponse.json({ error: 'Not a coach' }, { status: 403 });
    }

    // 3. Check if coach already has Stripe account
    let stripeAccountId = coachData.stripe?.accountId;

    if (!stripeAccountId) {
      // Create new Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: coachData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          coachId: userId,
          displayName: coachData.displayName,
        },
      });

      stripeAccountId = account.id;

      // Save to Firestore
      await db.collection('users').doc(userId).update({
        'stripe.accountId': stripeAccountId,
        'stripe.accountStatus': 'pending',
        'stripe.onboardingComplete': false,
        'stripe.lastUpdated': new Date(),
      });
    }

    // 4. Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/coach/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/coach/stripe/complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId: stripeAccountId,
    });
  } catch (error: any) {
    console.error('Stripe onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
```

**Frontend Component:**

```tsx
// components/coach/StripeOnboardingButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function StripeOnboardingButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/coach/stripe/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleOnboarding}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Connect Stripe to Receive Payments'}
      </button>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
```

### DAY 3: Payment Processing for Video Reviews

**Tasks (6-8 hours):**
- [ ] Create `/api/payments/create-payment-intent` endpoint
- [ ] Build video review payment UI component
- [ ] Handle payment confirmation
- [ ] Update submission status after payment
- [ ] Test payment flow end-to-end
- [ ] Handle payment failures gracefully

**Payment Intent API:**

```typescript
// app/api/payments/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PLATFORM_FEE_PERCENTAGE = 0.20; // 20% platform fee

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, amount } = body; // amount in dollars (e.g., 50)

    // 1. Verify authentication
    const token = request.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const athleteId = decodedToken.uid;

    // 2. Get submission details
    const db = getFirestore();
    const submissionDoc = await db.collection('submissions').doc(submissionId).get();

    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissionDoc.data();

    if (submission.athleteUid !== athleteId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 3. Get coach Stripe account
    const coachDoc = await db.collection('users').doc(submission.coachUid).get();
    const coachData = coachDoc.data();

    if (!coachData?.stripe?.accountId) {
      return NextResponse.json(
        { error: 'Coach has not set up payments yet' },
        { status: 400 }
      );
    }

    // 4. Get or create athlete Stripe customer
    const athleteDoc = await db.collection('users').doc(athleteId).get();
    const athleteData = athleteDoc.data();

    let customerId = athleteData?.stripe?.customerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: athleteData?.email,
        metadata: {
          athleteId,
          displayName: athleteData?.displayName,
        },
      });

      customerId = customer.id;

      await db.collection('users').doc(athleteId).update({
        'stripe.customerId': customerId,
      });
    }

    // 5. Calculate platform fee
    const amountInCents = Math.round(amount * 100);
    const platformFeeInCents = Math.round(amountInCents * PLATFORM_FEE_PERCENTAGE);

    // 6. Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      application_fee_amount: platformFeeInCents,
      transfer_data: {
        destination: coachData.stripe.accountId,
      },
      metadata: {
        athleteId,
        coachId: submission.coachUid,
        submissionId,
        type: 'video_review',
      },
      description: `Video Review - ${submission.title || 'Training Video'}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 7. Update submission with payment intent ID
    await db.collection('submissions').doc(submissionId).update({
      'payment.intentId': paymentIntent.id,
      'payment.amount': amount,
      'payment.status': 'pending',
      'payment.createdAt': new Date(),
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
```

**Payment UI Component:**

```tsx
// components/athlete/VideoReviewPayment.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  submissionId: string;
  amount: number;
  onSuccess: () => void;
}

function CheckoutForm({ submissionId, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/athlete/payment-success?submission=${submissionId}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
        <p className="text-gray-600">Total: ${amount.toFixed(2)}</p>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function VideoReviewPayment({
  submissionId,
  amount,
  onSuccess,
}: PaymentFormProps) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ submissionId, amount }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize payment');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, submissionId, amount]);

  if (loading) {
    return <div>Loading payment form...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return <div>Unable to load payment form</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <CheckoutForm
        submissionId={submissionId}
        amount={amount}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
```

### DAY 4: Webhooks & Subscription Handling

**Tasks (6-8 hours):**
- [ ] Set up webhook endpoint (`/api/webhooks/stripe`)
- [ ] Configure webhook secret in Stripe dashboard
- [ ] Handle `payment_intent.succeeded` event
- [ ] Handle `account.updated` event (coach onboarding completion)
- [ ] Implement subscription creation for lesson access
- [ ] Test webhooks using Stripe CLI
- [ ] Handle subscription lifecycle events

**Webhook Handler:**

```typescript
// app/api/webhooks/stripe/route.ts
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

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(db, paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(db, paymentIntent);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdate(db, account);
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
        await handleSubscriptionCancellation(db, subscription);
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

async function handlePaymentSuccess(
  db: FirebaseFirestore.Firestore,
  paymentIntent: Stripe.PaymentIntent
) {
  const { submissionId, athleteId, coachId } = paymentIntent.metadata;

  if (!submissionId) {
    console.warn('Payment intent missing submissionId:', paymentIntent.id);
    return;
  }

  // Update submission status
  await db.collection('submissions').doc(submissionId).update({
    'payment.status': 'paid',
    'payment.paidAt': new Date(),
    'payment.paymentIntentId': paymentIntent.id,
    status: 'pending', // Ready for coach review
  });

  // Log transaction
  await db.collection('transactions').add({
    type: 'video_review',
    paymentIntentId: paymentIntent.id,
    submissionId,
    athleteId,
    coachId,
    amount: paymentIntent.amount / 100,
    platformFee: (paymentIntent.application_fee_amount || 0) / 100,
    status: 'completed',
    createdAt: new Date(),
  });

  console.log(`✅ Payment succeeded for submission ${submissionId}`);

  // TODO: Send notification to coach that they have a new paid review
}

async function handlePaymentFailure(
  db: FirebaseFirestore.Firestore,
  paymentIntent: Stripe.PaymentIntent
) {
  const { submissionId } = paymentIntent.metadata;

  if (!submissionId) return;

  await db.collection('submissions').doc(submissionId).update({
    'payment.status': 'failed',
    'payment.failedAt': new Date(),
    'payment.errorMessage': paymentIntent.last_payment_error?.message || 'Payment failed',
  });

  console.log(`❌ Payment failed for submission ${submissionId}`);

  // TODO: Send notification to athlete about payment failure
}

async function handleAccountUpdate(
  db: FirebaseFirestore.Firestore,
  account: Stripe.Account
) {
  const coachId = account.metadata.coachId;

  if (!coachId) {
    console.warn('Account missing coachId:', account.id);
    return;
  }

  const chargesEnabled = account.charges_enabled || false;
  const payoutsEnabled = account.payouts_enabled || false;
  const onboardingComplete = chargesEnabled && payoutsEnabled;

  await db.collection('users').doc(coachId).update({
    'stripe.accountStatus': onboardingComplete ? 'active' : 'pending',
    'stripe.chargesEnabled': chargesEnabled,
    'stripe.payoutsEnabled': payoutsEnabled,
    'stripe.onboardingComplete': onboardingComplete,
    'stripe.lastUpdated': new Date(),
  });

  console.log(`✅ Coach ${coachId} Stripe account updated: ${onboardingComplete ? 'active' : 'pending'}`);
}

async function handleSubscriptionUpdate(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const { athleteId, coachId } = subscription.metadata;

  if (!athleteId || !coachId) {
    console.warn('Subscription missing metadata:', subscription.id);
    return;
  }

  await db.collection('users').doc(athleteId).update({
    [`stripe.subscriptions.${coachId}`]: {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Subscription ${subscription.id} updated for athlete ${athleteId}`);
}

async function handleSubscriptionCancellation(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const { athleteId, coachId } = subscription.metadata;

  if (!athleteId || !coachId) return;

  await db.collection('users').doc(athleteId).update({
    [`stripe.subscriptions.${coachId}.status`]: 'canceled',
    [`stripe.subscriptions.${coachId}.canceledAt`]: new Date(),
  });

  console.log(`✅ Subscription ${subscription.id} canceled for athlete ${athleteId}`);
}
```

**Testing Webhooks Locally:**

```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# This will give you a webhook signing secret like: whsec_...
# Add it to your .env.local file

# Test a payment in another terminal
stripe trigger payment_intent.succeeded
```

### DAY 5: Testing, Polish & Documentation

**Morning (3-4 hours):**
- [ ] Test complete payment flow (athlete → coach payout)
- [ ] Test coach onboarding from scratch
- [ ] Test payment failures and edge cases
- [ ] Test subscription creation and cancellation
- [ ] Verify webhook handling for all events
- [ ] Check dashboard displays (balances, transaction history)

**Afternoon (3-4 hours):**
- [ ] Create admin dashboard for viewing transactions
- [ ] Add error logging and monitoring
- [ ] Write internal documentation
- [ ] Create testing checklist for QA
- [ ] Prepare for production deployment

---

## DATABASE SCHEMA CHANGES

### Firestore Collections

**users collection (add to existing):**
```typescript
interface StripeData {
  // For coaches (sellers)
  accountId?: string;          // 'acct_...'
  accountStatus?: 'pending' | 'active' | 'restricted';
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;

  // For athletes (buyers)
  customerId?: string;         // 'cus_...'
  paymentMethods?: string[];   // ['pm_...']
  subscriptions?: {
    [coachId: string]: {
      subscriptionId: string;
      status: string;
      currentPeriodEnd: Date;
    };
  };

  lastUpdated: Date;
}
```

**submissions collection (add to existing):**
```typescript
interface SubmissionPayment {
  intentId?: string;           // 'pi_...'
  amount?: number;             // in dollars
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paidAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}
```

**transactions collection (NEW):**
```typescript
interface Transaction {
  id: string;
  type: 'video_review' | 'subscription' | 'refund';
  paymentIntentId?: string;
  subscriptionId?: string;
  submissionId?: string;
  athleteId: string;
  coachId: string;
  amount: number;              // Total amount in dollars
  platformFee: number;         // Platform commission in dollars
  coachPayout: number;         // Amount coach receives
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
}
```

---

## API ENDPOINTS TO BUILD

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/coach/stripe/onboard` | POST | Create Stripe Connect account | CRITICAL |
| `/api/coach/stripe/account-status` | GET | Check onboarding status | HIGH |
| `/api/coach/stripe/dashboard-link` | GET | Generate Stripe Express dashboard link | MEDIUM |
| `/api/payments/create-payment-intent` | POST | Process video review payment | CRITICAL |
| `/api/payments/create-subscription` | POST | Start lesson subscription | HIGH |
| `/api/payments/cancel-subscription` | POST | Cancel subscription | MEDIUM |
| `/api/payments/billing-portal` | POST | Generate customer portal link | MEDIUM |
| `/api/webhooks/stripe` | POST | Handle Stripe events | CRITICAL |
| `/api/admin/transactions` | GET | View all transactions (admin) | LOW |

---

## WEBHOOK CONFIGURATION

### Required Webhook Events

Configure these in your Stripe Dashboard (Developers → Webhooks):

```
PAYMENT EVENTS:
✓ payment_intent.succeeded
✓ payment_intent.payment_failed
✓ payment_intent.canceled

CONNECT EVENTS:
✓ account.updated
✓ account.application.deauthorized

SUBSCRIPTION EVENTS:
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed

REFUND EVENTS:
✓ charge.refunded
```

### Webhook Endpoint URL

**Development:** Use Stripe CLI forwarding
**Production:** `https://yourdomain.com/api/webhooks/stripe`

---

## TESTING STRATEGY

### Test Scenarios Checklist

#### Coach Onboarding
- [ ] New coach creates account
- [ ] Coach clicks "Connect Stripe"
- [ ] Redirects to Stripe onboarding
- [ ] Completes individual account setup
- [ ] Returns to platform with success
- [ ] Database updated with accountId
- [ ] Retry onboarding if incomplete
- [ ] Handle multiple onboarding attempts

#### Payment Flow
- [ ] Athlete submits video for review
- [ ] Clicks "Pay for Review"
- [ ] Enters card details (test card: 4242 4242 4242 4242)
- [ ] Payment succeeds
- [ ] Webhook fires payment_intent.succeeded
- [ ] Submission status updates to "paid"
- [ ] Coach sees submission in queue
- [ ] Platform fee calculated correctly (20%)
- [ ] Coach receives payout (80%)

#### Payment Failures
- [ ] Test declined card: 4000 0000 0000 0002
- [ ] Test insufficient funds: 4000 0000 0000 9995
- [ ] Test stolen card: 4000 0000 0000 9979
- [ ] Verify error messages display correctly
- [ ] Verify submission status stays "unpaid"
- [ ] Retry payment after failure

#### Subscriptions
- [ ] Athlete subscribes to coach's lessons
- [ ] Payment succeeds
- [ ] Access granted immediately
- [ ] Subscription auto-renews next month
- [ ] Handle failed renewal (update card prompt)
- [ ] Cancel subscription
- [ ] Access continues until period end
- [ ] Access revoked after cancellation period

#### Refunds
- [ ] Coach initiates refund request
- [ ] Admin processes refund
- [ ] Athlete receives refund
- [ ] Transaction recorded
- [ ] Platform fee returned proportionally

### Test Cards (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | 3D Secure required |
| 4000 0000 0000 0341 | Attach card fails |

**CVC:** Any 3 digits
**Expiry:** Any future date
**ZIP:** Any 5 digits

---

## SECURITY CHECKLIST

### Critical Security Measures

- [ ] **Never expose secret key client-side**
  - Use `STRIPE_SECRET_KEY` only in server-side code
  - Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for client

- [ ] **Verify webhook signatures**
  - Always use `stripe.webhooks.constructEvent()`
  - Reject webhooks with invalid signatures

- [ ] **Authenticate all API requests**
  - Verify Firebase auth tokens
  - Check user roles before processing payments

- [ ] **Validate amounts server-side**
  - Never trust client-submitted amounts
  - Calculate fees server-side

- [ ] **Prevent double payments**
  - Check payment status before creating new intent
  - Use idempotency keys for critical operations

- [ ] **Sanitize metadata**
  - Don't include PII in Stripe metadata
  - Use user IDs instead of names/emails

- [ ] **HTTPS only in production**
  - Stripe requires HTTPS for webhooks
  - Use valid SSL certificate

### Rate Limiting

```typescript
// Example rate limiting for payment endpoints
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per window
  message: 'Too many payment attempts, please try again later',
});
```

---

## GO-LIVE CHECKLIST

### Pre-Production

- [ ] Test all payment flows end-to-end
- [ ] Test webhook delivery and handling
- [ ] Verify database updates correctly
- [ ] Test error scenarios (failures, declines)
- [ ] Review Stripe dashboard for test transactions
- [ ] Check logs for errors
- [ ] Verify email notifications work
- [ ] Test on mobile devices
- [ ] Performance test (load testing payments)

### Production Setup

- [ ] Switch from test keys to live keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure production webhook secret
- [ ] Enable Stripe Radar (fraud detection)
- [ ] Set up Stripe account notifications
- [ ] Configure payout schedule (daily, weekly, monthly)
- [ ] Review Stripe fee structure
- [ ] Enable two-factor auth on Stripe account
- [ ] Add team members to Stripe account
- [ ] Set up monitoring and alerts

### Legal & Compliance

- [ ] Update Terms of Service (mention platform fees)
- [ ] Update Privacy Policy (Stripe data processing)
- [ ] Display pricing clearly to athletes
- [ ] Show platform fee breakdown
- [ ] Provide receipts/invoices
- [ ] Handle refund policy
- [ ] Comply with PCI-DSS (Stripe handles this)
- [ ] Tax reporting (1099-K for coaches earning >$600)

---

## ESTIMATED COSTS

### Stripe Fees

| Transaction Type | Stripe Fee | Your Fee | Total Fee |
|-----------------|-----------|----------|-----------|
| **Card Payment** | 2.9% + $0.30 | 20% of total | ~23-25% total |
| **Connect Platform Fee** | +0.25% | - | Added to above |

**Example:**
- Athlete pays $50 for video review
- Stripe takes: $1.75 (2.9% + $0.30 + 0.25%)
- Platform takes: $10.00 (20%)
- Coach receives: $38.25
- Platform net: $8.25 after Stripe fees

### Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| Stripe Connect | Free | Pay per transaction |
| Webhooks | Free | Unlimited |
| Customer Portal | Free | Included |
| Stripe Billing (Subscriptions) | Free | Pay per transaction |
| **Estimated Monthly** | $0-50 | Low volume: $0, High volume: payment fees only |

**At Scale (1000 transactions/month @ $50 avg):**
- Gross Revenue: $50,000
- Stripe Fees: ~$1,600
- Platform Revenue (20%): $10,000
- Net After Stripe: ~$8,400
- Coach Payouts: ~$38,400

---

## SUPPORT & RESOURCES

### Documentation

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Guide](https://stripe.com/docs/testing)

### Tools

- **Stripe CLI:** Test webhooks locally
- **Stripe Dashboard:** Monitor transactions
- **Stripe Logs:** Debug API requests
- **Stripe Radar:** Fraud prevention

### Getting Help

- Stripe Support: support@stripe.com
- Stripe Discord: discord.gg/stripe
- Stack Overflow: Tag `stripe-payments`

---

## NEXT STEPS AFTER MVP

### Phase 2 Enhancements

1. **Automatic Payouts**
   - Configure auto-payout schedule for coaches
   - Implement instant payouts (for premium coaches)

2. **Refund Management**
   - Build coach refund request flow
   - Admin approval system
   - Partial refunds

3. **Pricing Tiers**
   - Multiple subscription levels (Basic, Pro, Premium)
   - Coach sets own pricing
   - Tiered platform fees

4. **Analytics Dashboard**
   - Revenue charts
   - Transaction history
   - Payout tracking
   - Failed payment analytics

5. **Advanced Features**
   - Promo codes/discounts
   - Gift subscriptions
   - Team/group pricing
   - Installment payments

---

## CONCLUSION

This implementation plan gets you a **working Stripe integration in 3-5 days** that handles:

✅ Coach onboarding and payouts
✅ One-time payments for video reviews
✅ Recurring subscriptions for lesson access
✅ Webhook event handling
✅ Security best practices
✅ Comprehensive testing

**Focus Priority for Days 1-3:**
1. Coach Stripe Connect onboarding (Day 1-2)
2. Payment processing for video reviews (Day 3)
3. Webhook handling (Day 4)
4. Testing and polish (Day 5)

**You can ship this to production and start generating revenue immediately after Day 5.**

Let me know which areas you want me to dive deeper into or if you need any code examples expanded!
