import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase.admin';
import { getSubmission } from '@/lib/data/video-critique';
import { getStorage } from 'firebase-admin/storage';

export async function GET(
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

    // Fetch submission to verify ownership
    const submission = await getSubmission(params.id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions - only athlete owner can get upload URL
    if (submission.athleteUid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only upload to your own submissions' },
        { status: 403 }
      );
    }

    // Generate signed URL for upload
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(submission.videoStoragePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType: 'video/*',
    });

    return NextResponse.json({
      uploadUrl: url,
      storagePath: submission.videoStoragePath,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}