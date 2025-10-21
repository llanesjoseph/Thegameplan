import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase.admin';
import { claimSubmission, getSubmission } from '@/lib/data/video-critique';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie');
    const sessionCookie = authHeader
      ?.split('; ')
      .find((row) => row.startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
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
    const submission = await getSubmission(params.id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
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

    // Claim the submission
    await claimSubmission(params.id, coachId, coachName);

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