import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

const TIER_ACCESS = {
  free: {
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
    maxCoaches: 1, // FREE TIER: Allows 1 coach access
  },
};

/**
 * POST /api/athlete/subscriptions/setup-free
 * Sets up free tier subscription for athletes
 * This allows athletes to access 1 coach without payment
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

    // 2. Get athlete data from Firestore
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
        { error: 'Only athletes can set up free tier subscriptions' },
        { status: 403 }
      );
    }

    // 3. Set up free tier subscription
    const access = TIER_ACCESS.free;

    await adminDb.collection('users').doc(athleteUid).update({
      subscription: {
        tier: 'free',
        status: 'active', // Free tier is always active
        stripeCustomerId: athleteData.subscription?.stripeCustomerId || null,
        stripeSubscriptionId: null, // No Stripe subscription for free tier
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      access: {
        maxVideoSubmissions: access.maxVideoSubmissions,
        hasAIAssistant: access.hasAIAssistant,
        hasCoachFeed: access.hasCoachFeed,
        hasPriorityQueue: access.hasPriorityQueue,
        maxCoaches: access.maxCoaches, // CRITICAL: Set maxCoaches to 1 for free tier
      },
      updatedAt: new Date(),
    });

    console.log(`✅ [SETUP-FREE] Free tier subscription set up for athlete ${athleteUid}`);

    return NextResponse.json({
      success: true,
      message: 'Free tier subscription activated. You now have access to 1 coach.',
      subscription: {
        tier: 'free',
        status: 'active',
        isActive: true,
      },
      access: {
        maxCoaches: 1,
      },
    });

  } catch (error: any) {
    console.error('Error setting up free tier subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set up free tier subscription' },
      { status: 500 }
    );
  }
}

