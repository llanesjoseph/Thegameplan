# ATHLEAP STRIPE - FINAL PRICING MODEL
**Athlete Subscription Pricing**
**Last Updated:** November 9, 2025

---

## FINAL PRICING

### Tier 1: Basic Plan - $19.99/month
**What Athletes Get:**
- ✅ Access to coach's published lessons
- ✅ 2 video submissions per month
- ✅ Video review feedback from coach
- ✅ Progress tracking dashboard
- ✅ Email notifications
- ✅ Mobile app access

**Target Market:** Beginner athletes, casual training, trying out coaching

---

### Tier 2: Elite Plan - $29.99/month (MOST POPULAR)
**What Athletes Get:**
- ✅ Everything in Basic, PLUS:
- ✅ **Unlimited video submissions**
- ✅ **Priority review queue** (faster feedback)
- ✅ **AI coaching assistant 24/7**
- ✅ **Access to coach's feed** (premium content)
- ✅ **Advanced analytics & progress reports**
- ✅ **Direct messaging with coach**
- ✅ **Early access to new features**

**Target Market:** Serious athletes, competitive players, committed training

**Price Difference:** Only $10/month more for unlimited submissions + AI + priority support

---

## STRIPE SETUP (STEP-BY-STEP)

### Step 1: Create Products in Stripe Dashboard

1. **Go to:** https://dashboard.stripe.com/test/products
2. **Click:** "Add product"

**Product 1: Athleap Basic**
- Name: `Athleap Basic - Athlete Subscription`
- Description: `Essential training access with personalized coaching`
- Pricing Model: `Recurring`
- Price: `$19.99`
- Billing Period: `Monthly`
- Currency: `USD`
- Click "Save product"
- **Copy the Price ID:** `price_XXXBASIC123` ← You'll need this!

**Product 2: Athleap Elite**
- Name: `Athleap Elite - Athlete Subscription`
- Description: `Premium training with unlimited access and AI assistance`
- Pricing Model: `Recurring`
- Price: `$29.99`
- Billing Period: `Monthly`
- Currency: `USD`
- Click "Save product"
- **Copy the Price ID:** `price_XXXELITE456` ← You'll need this!

---

## IMPLEMENTATION

### Environment Variables

**File:** `.env.local`
```env
# Stripe Keys (Test Mode for now)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Athlete Subscription Price IDs
STRIPE_ATHLETE_BASIC_PRICE_ID=price_XXXBASIC123
STRIPE_ATHLETE_ELITE_PRICE_ID=price_XXXELITE456

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

### API Endpoint: Create Subscription Checkout

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
  basic: process.env.STRIPE_ATHLETE_BASIC_PRICE_ID!,   // $19.99/month
  elite: process.env.STRIPE_ATHLETE_ELITE_PRICE_ID!,   // $29.99/month
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
        { error: 'You already have an active subscription. Visit your dashboard to manage it.' },
        { status: 400 }
      );
    }

    // 4. Get or create Stripe customer
    let customerId = userData.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName,
        metadata: {
          userId,
          role: 'athlete',
          coachId: userData.coachId || userData.assignedCoachId || '',
        },
      });

      customerId = customer.id;

      await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customerId,
        'subscription.updatedAt': new Date(),
      });
    }

    // 5. Validate tier
    const priceId = PRICE_IDS[tier as 'basic' | 'elite'];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // 6. Create Stripe Checkout Session
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete?subscription=success&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete/pricing?canceled=true`,
      metadata: {
        userId,
        tier,
        role: 'athlete',
        coachId: userData.coachId || userData.assignedCoachId || '',
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
          role: 'athlete',
          coachId: userData.coachId || userData.assignedCoachId || '',
        },
        trial_period_days: 7, // Optional: 7-day free trial
      },
      allow_promotion_codes: true, // Allow promo codes at checkout
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

---

### Pricing Page UI

**File:** `app/dashboard/athlete/pricing/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Check, Star, Zap, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 19.99,
    description: 'Perfect for athletes starting their training journey',
    features: [
      'Access to all published lessons',
      '2 video submissions per month',
      'Professional video review feedback',
      'Progress tracking dashboard',
      'Email notifications',
      'Mobile app access',
    ],
    icon: Check,
    color: 'from-blue-500 to-cyan-500',
    badge: 'Great Value',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 29.99,
    description: 'For serious athletes ready to dominate',
    features: [
      '✨ Everything in Basic, PLUS:',
      '🎥 Unlimited video submissions',
      '⚡ Priority review queue',
      '🤖 AI coaching assistant 24/7',
      '📰 Exclusive coach feed access',
      '📊 Advanced analytics & insights',
      '💬 Direct messaging with coach',
      '🏆 Early access to new features',
    ],
    popular: true,
    icon: Trophy,
    color: 'from-purple-500 to-pink-500',
    badge: 'Most Popular',
    savings: 'Best Value - Only $10 more for unlimited!',
  },
];

export default function AthletePricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'basic' | 'elite') => {
    if (!user) {
      router.push('/login?redirect=/dashboard/athlete/pricing');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-400 rounded-full text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            7-DAY FREE TRIAL • CANCEL ANYTIME
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Choose Your Training Level
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get personalized coaching, video feedback, and AI-powered training insights
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {PLANS.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800/50 backdrop-blur-lg rounded-3xl overflow-hidden transition-all hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50' : 'border border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-bold">
                    ⭐ {plan.badge.toUpperCase()}
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {plan.name}
                      </h3>
                      {!plan.popular && (
                        <span className="text-sm text-gray-400">{plan.badge}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    {plan.savings && (
                      <p className="text-sm text-green-400 font-semibold mt-2">
                        💚 {plan.savings}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id as 'basic' | 'elite')}
                    disabled={loading === plan.id}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Loading...
                      </span>
                    ) : (
                      'Start 7-Day Free Trial'
                    )}
                  </button>

                  {/* Features */}
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden mb-12">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 text-white font-semibold">Basic</th>
                    <th className="text-center py-3 px-4 text-white font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4">Access to Lessons</td>
                    <td className="text-center py-3 px-4">✅</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4">Video Submissions</td>
                    <td className="text-center py-3 px-4">2/month</td>
                    <td className="text-center py-3 px-4 text-green-400 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4">AI Coaching Assistant</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4">Priority Review Queue</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4">Coach's Feed Access</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4">Direct Messaging</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Advanced Analytics</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold text-lg text-white mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-gray-300">
                You get full access to your chosen plan for 7 days, completely free.
                No credit card charge during the trial. Cancel anytime before it ends with no fee.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold text-lg text-white mb-2">
                Can I upgrade or downgrade later?
              </h3>
              <p className="text-gray-300">
                Yes! You can switch between Basic and Elite anytime from your dashboard.
                Upgrades take effect immediately, downgrades apply at the next billing cycle.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold text-lg text-white mb-2">
                What happens if I cancel?
              </h3>
              <p className="text-gray-300">
                You keep full access until the end of your billing period. After that,
                you can still view past content but won't be able to submit new videos or
                access premium features.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold text-lg text-white mb-2">
                Is Elite really worth the extra $10?
              </h3>
              <p className="text-gray-300">
                Absolutely! Elite gets you unlimited video submissions (Basic is limited to 2/month),
                AI assistant, priority feedback, and direct coach messaging. If you're serious about
                improving, Elite is the best value.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12 pt-12 border-t border-gray-700">
          <p className="text-gray-400 mb-4">
            Still have questions? Contact us at{' '}
            <a href="mailto:support@gameplan.com" className="text-purple-400 hover:text-purple-300">
              support@gameplan.com
            </a>
          </p>
          <p className="text-sm text-gray-500">
            All plans include secure payment processing by Stripe. Cancel anytime, no questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## REVENUE CALCULATIONS

### Monthly Recurring Revenue (MRR)

**Example with 100 athletes:**
- 60 athletes on Basic ($19.99) = **$1,199.40/month**
- 40 athletes on Elite ($29.99) = **$1,199.60/month**
- **Total MRR: $2,399/month**
- **Annual Run Rate: $28,788/year**

**After Stripe Fees (2.9% + $0.30):**
- Basic net per athlete: $19.41
- Elite net per athlete: $29.20
- **Net MRR: ~$2,304/month**

### Coach Payout Examples

**If you pay coaches 60% of revenue:**
- Your share: 40% = **~$921/month**
- Coach payouts: 60% = **~$1,383/month**

**If you pay coaches 70% of revenue:**
- Your share: 30% = **~$691/month**
- Coach payouts: 70% = **~$1,613/month**

**If you pay coaches per athlete (fixed rate):**
- Pay $10 per basic athlete = $600/month
- Pay $15 per elite athlete = $600/month
- Total coach costs = $1,200/month
- **Your profit: ~$1,104/month**

---

## WHAT'S NEXT

### Immediate Actions:

1. **Create Stripe Products:**
   - Go to Stripe Dashboard
   - Create "Athleap Basic" at $19.99/month
   - Create "Athleap Elite" at $29.99/month
   - Copy both Price IDs

2. **Update Environment Variables:**
   ```env
   STRIPE_ATHLETE_BASIC_PRICE_ID=price_XXXBASIC123
   STRIPE_ATHLETE_ELITE_PRICE_ID=price_XXXELITE456
   ```

3. **Install Stripe SDK:**
   ```bash
   npm install stripe @stripe/stripe-js @stripe/react-stripe-js
   ```

4. **Create API Endpoint:**
   - Copy the checkout route code above
   - Save to `app/api/athlete/subscriptions/create-checkout/route.ts`

5. **Create Pricing Page:**
   - Copy the pricing page code above
   - Save to `app/dashboard/athlete/pricing/page.tsx`

6. **Test Checkout Flow:**
   - Visit `/dashboard/athlete/pricing`
   - Click "Start 7-Day Free Trial"
   - Use test card: `4242 4242 4242 4242`
   - Verify checkout succeeds

Ready to start building? Want me to create the actual code files in your project now?
