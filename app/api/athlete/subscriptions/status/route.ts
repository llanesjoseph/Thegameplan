import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase.admin';
import { getSubscriptionSummary } from '@/lib/stripe/subscriptionUtils';

export async function GET(request: NextRequest) {
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

    // 2. Get subscription summary
    const summary = await getSubscriptionSummary(athleteUid);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
