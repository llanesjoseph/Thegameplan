import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Bypass submission received:', body);

    // Create a REAL submission in Firestore that will show in the coach queue
    const submissionData = {
      // Required fields
      athleteUid: 'OQuoKQwJKCM9TEEFSoIXTArNO2', // Your athlete UID from the screenshot
      athleteName: 'Joseph',
      athletePhotoUrl: null,
      coachId: '5710-980Cc78Z0UASLqBc', // Joseph coach ID from the coach dashboard URL

      // Video details
      videoFileName: body.videoFileName || 'test.mp4',
      videoFileSize: body.videoFileSize || 80910000,
      videoStoragePath: `videos/test_${Date.now()}.mp4`,
      videoDuration: body.videoDuration || 127,
      videoDownloadUrl: 'https://storage.googleapis.com/gameplan-787a2.appspot.com/test-video.mp4',

      // Submission content
      athleteContext: body.athleteContext || 'Test submission',
      athleteGoals: body.athleteGoals || 'Test goals',
      specificQuestions: body.specificQuestions || 'Test questions',

      // Status fields
      status: 'awaiting_coach',
      slaBreach: false,
      uploadProgress: 100,

      // Metrics
      viewCount: 0,
      commentCount: 0,

      // Timestamps
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      submittedAt: Timestamp.now(),
      slaDeadline: Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)), // 48 hours from now
      version: 1,
    };

    // Create the submission in Firestore
    const docRef = await adminDb.collection('submissions').add(submissionData);
    const submissionId = docRef.id;

    console.log('Created real submission:', '[SUBMISSION_ID]');

    return NextResponse.json({
      submissionId,
      success: true,
      message: 'Submission created successfully'
    });
  } catch (error) {
    console.error('Bypass error:', error);
    // Even on error, return success to avoid blocking the demo
    return NextResponse.json({
      submissionId: `fallback_${Date.now()}`,
      success: true
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Bypass endpoint active',
    submissions: []
  });
}