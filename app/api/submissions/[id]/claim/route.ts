import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication using Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const coachId = decodedToken.uid;
    const coachName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Coach';

    // TODO: Verify user has coach role
    // const customClaims = decodedToken.customClaims;
    // if (!customClaims?.role || customClaims.role !== 'coach') {
    //   return NextResponse.json(
    //     { error: 'Forbidden - Only coaches can claim submissions' },
    //     { status: 403 }
    //   );
    // }

    // Fetch submission to verify it exists and is claimable
    // Handle both submissions and feedback_requests collections
    let submissionDoc;
    let collectionName;
    
    console.log(`[CLAIM-API] Attempting to claim submission: ${params.id}`);
    
    if (params.id.startsWith('fr_')) {
      // This is from feedback_requests collection
      const actualId = params.id.replace('fr_', '');
      console.log(`[CLAIM-API] Looking in feedback_requests collection for ID: ${actualId}`);
      submissionDoc = await adminDb.collection('feedback_requests').doc(actualId).get();
      collectionName = 'feedback_requests';
    } else {
      // This is from submissions collection
      console.log(`[CLAIM-API] Looking in submissions collection for ID: ${params.id}`);
      submissionDoc = await adminDb.collection('submissions').doc(params.id).get();
      collectionName = 'submissions';
    }
    
    console.log(`[CLAIM-API] Found submission: ${submissionDoc.exists}, collection: ${collectionName}`);
    
    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionDoc.data();
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission data not found' },
        { status: 404 }
      );
    }

    // Check if already claimed by someone else
    if (submission.claimedBy && submission.claimedBy !== coachId) {
      return NextResponse.json(
        { error: 'Submission already claimed by another coach' },
        { status: 409 }
      );
    }

    // Check if already claimed by this coach
    if (submission.claimedBy === coachId) {
      return NextResponse.json({
        success: true,
        message: 'Already claimed by you',
        claimedAt: submission.claimedAt,
        claimedBy: coachId,
      });
    }

    // Claim the submission via Admin SDK to avoid client rule issues
    const docId = params.id.startsWith('fr_') ? params.id.replace('fr_', '') : params.id;
    await adminDb.collection(collectionName).doc(docId).update({
      claimedBy: coachId,
      claimedByName: coachName,
      claimedAt: new Date(),
      status: 'claimed',
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      claimedAt: new Date(),
      claimedBy: coachId,
    });
  } catch (error) {
    console.error('Error claiming submission:', error);
    return NextResponse.json(
      { error: 'Failed to claim submission' },
      { status: 500 }
    );
  }
}