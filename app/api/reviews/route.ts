import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(idToken);

    // Get submissionId from query params
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // Fetch review using Admin SDK
    const reviewsQuery = await adminDb
      .collection('reviews')
      .where('submissionId', '==', submissionId)
      .limit(1)
      .get();

    if (reviewsQuery.empty) {
      return NextResponse.json({ review: null });
    }

    const reviewDoc = reviewsQuery.docs[0];
    const review = { id: reviewDoc.id, ...reviewDoc.data() };

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}
