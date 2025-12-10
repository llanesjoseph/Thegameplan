import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Access limits per tier (must match webhook)
const TIER_ACCESS = {
  basic: {
    maxVideoSubmissions: 2,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
  },
  elite: {
    maxVideoSubmissions: -1,
    hasAIAssistant: true,
    hasCoachFeed: true,
    hasPriorityQueue: true,
  },
  none: {
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
  },
};

/**
 * Verify Stripe checkout session and update Firebase immediately
 * This bypasses the webhook race condition by directly checking Stripe
 * and updating Firebase if the session was successful
 */
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

    // 2. Get session ID from request (optional - we can also check by customer)
    const body = await request.json().catch(() => ({}));
    const { sessionId } = body;

    console.log(`[VERIFY-SESSION] Verifying subscription for user ${athleteUid}, sessionId: ${sessionId || 'none'}`);

    // 3. Get current user data to find their Stripe customer ID
    const userDoc = await adminDb.collection('users').doc(athleteUid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already has active subscription in Firebase
    const currentSubscription = userData.subscription;
    if (currentSubscription?.status === 'active' || currentSubscription?.status === 'trialing') {
      console.log(`[VERIFY-SESSION] User ${athleteUid} already has active subscription in Firebase`);
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        tier: currentSubscription.tier,
        status: currentSubscription.status,
        isActive: true,
      });
    }

    const stripeCustomerId = currentSubscription?.stripeCustomerId;

    let subscription: Stripe.Subscription | null = null;
    let tier: 'basic' | 'elite' = 'basic';

    // Strategy 1: If we have a session ID, retrieve it directly
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
        });

        // Verify this session belongs to this user
        const sessionFirebaseUID = session.metadata?.firebaseUID;
        if (sessionFirebaseUID && sessionFirebaseUID !== athleteUid) {
          console.warn(`[VERIFY-SESSION] Session ${sessionId} belongs to different user`);
          return NextResponse.json({ error: 'Session mismatch' }, { status: 403 });
        }

        if (session.subscription && typeof session.subscription !== 'string') {
          subscription = session.subscription as Stripe.Subscription;
          tier = (session.metadata?.tier as 'basic' | 'elite') || 'basic';
        } else if (typeof session.subscription === 'string') {
          subscription = await stripe.subscriptions.retrieve(session.subscription);
          tier = (session.metadata?.tier as 'basic' | 'elite') || 'basic';
        }
      } catch (err) {
        console.warn(`[VERIFY-SESSION] Could not retrieve session ${sessionId}:`, err);
      }
    }

    // Strategy 2: If no session or session didn't have subscription, check by customer ID
    if (!subscription && stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'all',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          // Try to get tier from subscription metadata
          tier = (subscription.metadata?.tier as 'basic' | 'elite') || 'basic';
          
          // If not in metadata, try to determine from price ID
          if (!subscription.metadata?.tier) {
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId === process.env.STRIPE_ATHLETE_BASIC_PRICE_ID) {
              tier = 'basic';
            } else if (priceId === process.env.STRIPE_ATHLETE_ELITE_PRICE_ID) {
              tier = 'elite';
            }
          }
        }
      } catch (err) {
        console.warn(`[VERIFY-SESSION] Could not list subscriptions for customer ${stripeCustomerId}:`, err);
      }
    }

    // 4. If we found a subscription, update Firebase immediately
    if (subscription) {
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';

      if (isActive) {
        const access = TIER_ACCESS[tier];

        // Update Firebase with subscription data
        await adminDb.collection('users').doc(athleteUid).update({
          'subscription.tier': tier,
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.stripeCustomerId': typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id,
          'subscription.status': subscription.status,
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          'access.maxVideoSubmissions': access.maxVideoSubmissions,
          'access.hasAIAssistant': access.hasAIAssistant,
          'access.hasCoachFeed': access.hasCoachFeed,
          'access.hasPriorityQueue': access.hasPriorityQueue,
          updatedAt: new Date(),
        });

        console.log(`[VERIFY-SESSION] ✅ Updated Firebase for user ${athleteUid}: ${tier} tier, status: ${subscription.status}`);

        return NextResponse.json({
          success: true,
          verified: true,
          tier,
          status: subscription.status,
          isActive: true,
        });
      } else {
        console.log(`[VERIFY-SESSION] Subscription found but not active: ${subscription.status}`);
        return NextResponse.json({
          success: true,
          verified: true,
          tier,
          status: subscription.status,
          isActive: false,
        });
      }
    }

    // 5. No subscription found - might still be processing
    console.log(`[VERIFY-SESSION] No subscription found for user ${athleteUid}`);
    return NextResponse.json({
      success: true,
      verified: false,
      message: 'No active subscription found. If you just completed checkout, please wait a moment and try again.',
      isActive: false,
    });

  } catch (error: any) {
    console.error('[VERIFY-SESSION] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}

