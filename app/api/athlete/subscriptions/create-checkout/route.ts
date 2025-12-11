import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PRICE_IDS = {
  free: process.env.STRIPE_ATHLETE_FREE_PRICE_ID!,
  basic: process.env.STRIPE_ATHLETE_BASIC_PRICE_ID!,
  elite: process.env.STRIPE_ATHLETE_ELITE_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const athleteUid = decodedToken.uid;

    // 2. Get request body
    const { tier } = await request.json();

    if (!tier || (tier !== 'free' && tier !== 'basic' && tier !== 'elite')) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "free", "basic", or "elite".' },
        { status: 400 }
      );
    }

    // 3. Get athlete data from Firestore
    const athleteDoc = await adminDb.collection('users').doc(athleteUid).get();

    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    const athleteData = athleteDoc.data();

    // Check if athlete role
    if (!athleteData?.role || athleteData.role !== 'athlete') {
      return NextResponse.json(
        { error: 'Only athletes can purchase subscriptions' },
        { status: 403 }
      );
    }

    // 4. Create or retrieve Stripe customer
    let stripeCustomerId = athleteData.subscription?.stripeCustomerId as string | undefined;

    // Helper to create a fresh customer and persist it
    const createFreshCustomer = async () => {
      const customer = await stripe.customers.create({
        email: athleteData.email,
        name: athleteData.displayName || athleteData.name,
        metadata: {
          firebaseUID: athleteUid,
          role: 'athlete',
          platform: 'athleap',
        },
      });

      await adminDb.collection('users').doc(athleteUid).update({
        'subscription.stripeCustomerId': customer.id,
      });

      return customer.id;
    };

    if (stripeCustomerId) {
      // Validate that the stored customerId actually exists in the current Stripe account.
      // This protects us when switching Stripe accounts/keys so old IDs don't break checkout.
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (err: any) {
        if (err?.code === 'resource_missing') {
          // Customer doesn't exist in this Stripe account – create a new one for this athlete.
          stripeCustomerId = await createFreshCustomer();
        } else {
          throw err;
        }
      }
    } else {
      stripeCustomerId = await createFreshCustomer();
    }

    // 5. Check if they already have an active subscription
    if (athleteData.subscription?.status === 'active' ||
        athleteData.subscription?.status === 'trialing') {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from your account settings.' },
        { status: 400 }
      );
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[tier as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          firebaseUID: athleteUid,
          tier: tier,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete/pricing?subscription=canceled`,
      metadata: {
        firebaseUID: athleteUid,
        tier: tier,
      },
    });

    // 7. Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
