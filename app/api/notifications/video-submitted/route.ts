import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { sendVideoSubmissionNotification } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const athleteId = decodedToken.uid;

    // Parse request body
    const { submissionId, skillName, context } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // Fetch submission to get coach info
    const submissionDoc = await adminDb.collection('submissions').doc(submissionId).get();
    
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

    // Get athlete info
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get();
    const athleteData = athleteDoc.data();
    const athleteName = athleteData?.displayName || athleteData?.email || 'Athlete';

    // Get assigned coach ID from submission (use assignedCoachId or coachId)
    const assignedCoachId = submission.assignedCoachId || submission.coachId;

    if (!assignedCoachId) {
      console.log(`No assigned coach for submission ${submissionId}, skipping notification`);
      return NextResponse.json({
        success: true,
        message: 'No assigned coach, notification skipped'
      });
    }

    // Fetch coach details from users collection
    const coachDoc = await adminDb.collection('users').doc(assignedCoachId).get();

    if (!coachDoc.exists) {
      console.error(`Assigned coach ${assignedCoachId} not found for submission ${submissionId}`);
      return NextResponse.json({
        error: 'Assigned coach not found'
      }, { status: 404 });
    }

    const coachData = coachDoc.data();
    const coachEmail = coachData?.email;
    const coachName = coachData?.displayName || coachData?.email || 'Coach';

    if (!coachEmail) {
      console.error(`Coach ${assignedCoachId} has no email address`);
      return NextResponse.json({
        error: 'Coach email not found'
      }, { status: 404 });
    }

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://playbookd.crucibleanalytics.dev'}/dashboard/coach/review/${submissionId}`;

    // Send email notification to the ASSIGNED coach only
    await sendVideoSubmissionNotification({
      to: coachEmail,
      coachName: coachName,
      athleteName: athleteName,
      skillName: skillName || 'Video Submission',
      submissionId: submissionId,
      reviewUrl,
      context: context || ''
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending video submission notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
