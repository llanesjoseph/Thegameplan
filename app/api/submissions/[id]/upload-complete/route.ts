import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { getStorage } from 'firebase-admin/storage';

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

    // Parse request body
    const body = await request.json();
    const { videoUrl, thumbnailUrl, duration } = body;

    // Fetch submission to verify ownership
    const submissionDoc = await adminDb.collection('submissions').doc(params.id).get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submissionData = submissionDoc.data();

    // Check permissions - only athlete owner can complete upload
    if (submissionData?.athleteUid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only complete uploads for your own submissions' },
        { status: 403 }
      );
    }

    // Update submission with video URL and mark as ready for review
    const updateData: any = {
      status: 'awaiting_coach',
      updatedAt: new Date(),
      submittedAt: new Date(),
    };

    // Add videoUrl if provided
    if (videoUrl) {
      updateData.videoUrl = videoUrl;
    }

    // Add thumbnailUrl if provided
    if (thumbnailUrl) {
      updateData.thumbnailUrl = thumbnailUrl;
    }

    // Add duration if provided
    if (duration) {
      updateData.videoDuration = duration;
    }

    // Update the submission
    await adminDb.collection('submissions').doc(params.id).update(updateData);

    console.log(`✅ Upload completed for submission ${params.id} by athlete [ATHLETE_ID]`);

    return NextResponse.json({
      success: true,
      message: 'Upload completed successfully',
      submissionId: params.id,
    });

  } catch (error) {
    console.error('Error completing upload:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
