import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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
        { error: 'Only athletes can cancel subscriptions' },
        { status: 403 }
      );
    }

    // 3. Get Stripe subscription ID
    const stripeSubscriptionId = athleteData.subscription?.stripeSubscriptionId;

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // 4. Cancel the subscription at period end (allows access until period ends)
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // 5. Update Firestore
    await adminDb.collection('users').doc(athleteUid).update({
      'subscription.cancelAtPeriodEnd': true,
      'subscription.status': 'canceling',
      'subscription.updatedAt': new Date(),
    });

    // 6. Get period end date
    const periodEnd = new Date(subscription.current_period_end * 1000);

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelAtPeriodEnd: true,
      periodEnd: periodEnd.toISOString(),
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    });

  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

