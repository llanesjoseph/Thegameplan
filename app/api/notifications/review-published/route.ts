import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { sendReviewPublishedNotification } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const coachId = decodedToken.uid;

    // Parse request body
    const { submissionId, athleteUid, skillName } = await request.json();

    if (!submissionId || !athleteUid) {
      return NextResponse.json(
        { error: 'submissionId and athleteUid are required' },
        { status: 400 }
      );
    }

    // Get athlete info
    const athleteDoc = await adminDb.collection('users').doc(athleteUid).get();
    const athleteData = athleteDoc.data();
    const athleteName = athleteData?.displayName || athleteData?.email || 'Athlete';
    const athleteEmail = athleteData?.email || athleteName; // Fallback to name if no email

    // Get coach info
    const coachDoc = await adminDb.collection('users').doc(coachId).get();
    const coachData = coachDoc.data();
    const coachName = coachData?.displayName || coachData?.email || 'Coach';

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://playbookd.crucibleanalytics.dev'}/dashboard/athlete/reviews/${submissionId}`;

    // Send email notification
    await sendReviewPublishedNotification({
      to: athleteEmail,
      athleteName: athleteName,
      coachName: coachName,
      skillName: skillName || 'Video Submission',
      submissionId: submissionId,
      reviewUrl
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending review published notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
