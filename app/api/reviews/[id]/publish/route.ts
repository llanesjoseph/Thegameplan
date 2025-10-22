import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Update review status to published using Admin SDK
    await adminDb.collection('reviews').doc(params.id).update({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    });

    // Also update the submission status to complete
    const reviewDoc = await adminDb.collection('reviews').doc(params.id).get();
    const reviewData = reviewDoc.data();
    
    if (reviewData?.submissionId) {
      await adminDb.collection('submissions').doc(reviewData.submissionId).update({
        status: 'complete',
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error publishing review:', error);
    return NextResponse.json(
      { error: 'Failed to publish review' },
      { status: 500 }
    );
  }
}
