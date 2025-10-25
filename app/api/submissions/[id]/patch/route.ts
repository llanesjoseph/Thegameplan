import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

export async function PATCH(
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
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // Get submission data
    const submissionRef = adminDb.collection('submissions').doc(params.id);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submissionDoc.data();

    // SECURITY: Verify the user owns this submission
    if (submissionData?.athleteUid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own submissions' },
        { status: 403 }
      );
    }

    // Parse update data
    const updateData = await request.json();

    // Update submission
    await submissionRef.update({
      ...updateData,
      updatedAt: new Date()
    });

    console.log(`✅ Updated submission ${params.id} for athlete`);

    return NextResponse.json({
      success: true,
      message: 'Submission updated successfully',
    });

  } catch (error: any) {
    console.error('❌ Error updating submission:', error);
    return NextResponse.json(
      {
        error: 'Failed to update submission',
        details: error.message
      },
      { status: 500 }
    );
  }
}
