import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase.admin';
import { getSubmission, updateSubmission } from '@/lib/data/submissions';
import { getReviewBySubmission } from '@/lib/data/reviews';
import { createNotification } from '@/lib/data/notifications';

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
    const userId = decodedToken.uid;

    // Fetch submission
    const submission = await getSubmission(params.id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Verify athlete owns this submission
    if (submission.athleteUid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only request follow-up on your own submissions' },
        { status: 403 }
      );
    }

    // Check if follow-up already requested
    if (submission.followupRequested) {
      return NextResponse.json(
        { error: 'Follow-up already requested' },
        { status: 400 }
      );
    }

    // Get the review to check if it's published
    const review = await getReviewBySubmission(params.id);

    if (!review || review.status !== 'published') {
      return NextResponse.json(
        { error: 'Review not yet published' },
        { status: 400 }
      );
    }

    // Check if within 7-day window
    const publishedDate = review.publishedAt instanceof Date
      ? review.publishedAt
      : (review.publishedAt as any).toDate();

    const daysSincePublished = Math.floor(
      (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePublished > 7) {
      return NextResponse.json(
        { error: 'Follow-up window has expired (7 days)' },
        { status: 400 }
      );
    }

    // Update submission with follow-up request
    const followupDeadline = new Date();
    followupDeadline.setDate(followupDeadline.getDate() + 2); // 48-hour deadline

    await updateSubmission(params.id, {
      followupRequested: true,
      followupRequestedAt: new Date(),
      followupDeadline,
      status: 'reopened',
    });

    // Create notification for coach
    await createNotification(
      review.coachUid,
      'followup_requested',
      'Follow-up Requested',
      `${submission.athleteName} has requested a follow-up on their ${submission.skillName} review`,
      `/dashboard/coach/review/${params.id}`,
      {
        submissionId: params.id,
        reviewId: review.id,
      }
    );

    return NextResponse.json({
      success: true,
      followupDeadline,
    });
  } catch (error) {
    console.error('Error requesting follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to request follow-up' },
      { status: 500 }
    );
  }
}