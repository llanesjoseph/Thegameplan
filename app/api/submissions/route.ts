import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { createSubmission, getSubmissions } from '@/lib/data/video-critique';
import { CreateSubmissionRequest } from '@/types/video-critique';
import { generateVideoStoragePath } from '@/lib/upload/uppy-config';

export async function POST(request: NextRequest) {
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
    const userName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Athlete';
    const userPhoto = decodedToken.picture;

    // Get athlete's assigned coach from user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const coachId = userData?.coachId || userData?.assignedCoachId;

    if (!coachId) {
      return NextResponse.json(
        { error: 'No coach assigned. Please contact support.' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify coach exists and is active
    const coachDoc = await adminDb.collection('users').doc(coachId).get();
    if (!coachDoc.exists) {
      return NextResponse.json(
        { error: 'Assigned coach not found. Please contact support.' },
        { status: 400 }
      );
    }

    const coachData = coachDoc.data();
    if (coachData?.role !== 'coach' && coachData?.role !== 'creator') {
      return NextResponse.json(
        { error: 'Assigned coach is not active. Please contact support.' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: CreateSubmissionRequest & {
      videoFileName: string;
      videoFileSize: number;
      videoDuration?: number;
    } = await request.json();

    // Validate required fields
    if (!body.athleteContext) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate submission ID (Firestore will do this, but we need it for storage path)
    const tempSubmissionId = `submission_${Date.now()}_${userId.slice(0, 8)}`;

    // Generate storage path (use athlete userId as identifier)
    const storagePath = generateVideoStoragePath(
      userId,
      tempSubmissionId,
      body.videoFileName
    );

    // Create submission in Firestore
    const submissionId = await createSubmission({
      ...body,
      athleteUid: userId,
      athleteName: userName,
      athletePhotoUrl: userPhoto,
      coachId: coachId, // Add assigned coach ID
      videoStoragePath: storagePath,
    });

    return NextResponse.json({
      submissionId,
      uploadUrl: `/api/submissions/${submissionId}/upload-url`,
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const athleteUid = searchParams.get('athleteUid');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filters
    const filters: any = {};
    if (athleteUid) filters.athleteUid = athleteUid;
    if (teamId) filters.teamId = teamId;
    if (status) filters.status = status;

    // Fetch submissions
    const result = await getSubmissions(filters, { limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}