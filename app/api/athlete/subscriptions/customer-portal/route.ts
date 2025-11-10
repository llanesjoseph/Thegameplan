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
        { error: 'Only athletes can access subscription management' },
        { status: 403 }
      );
    }

    // 3. Get Stripe customer ID
    const stripeCustomerId = athleteData.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // 4. Create Stripe Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/athlete?subscription=managed`,
    });

    // 5. Return portal URL
    return NextResponse.json({
      url: session.url,
    });

  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
