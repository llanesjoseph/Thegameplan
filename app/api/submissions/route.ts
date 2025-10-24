import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { CreateSubmissionRequest } from '@/types/video-critique';
import { generateVideoStoragePath } from '@/lib/upload/uppy-config';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Athlete';
    const userPhoto = decodedToken.picture;

    // Get athlete's assigned coach from user document (optional)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const coachId = userData?.coachId || userData?.assignedCoachId;

    // Coach is optional - video can be submitted without one
    if (coachId) {
      // Verify coach exists and is active
      const coachDoc = await adminDb.collection('users').doc(coachId).get();
      if (!coachDoc.exists) {
        console.warn(`Assigned coach ${coachId} not found for user ${userId}`);
      } else {
        const coachData = coachDoc.data();
        if (coachData?.role !== 'coach' && coachData?.role !== 'creator') {
          console.warn(`Assigned coach ${coachId} is not active for user ${userId}`);
        }
      }
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

    // Create submission in Firestore via Admin SDK (bypasses client rules)
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const submissionData = {
      // Owner info
      athleteUid: userId,
      athleteId: userId, // Add athleteId field for coach queue compatibility
      athleteName: userName,
      athletePhotoUrl: userPhoto || null,
      teamId: userId,
      coachId: coachId || null,

      // Skill context (optional)
      skillId: null,
      skillName: null,

      // Video info
      videoFileName: body.videoFileName,
      videoFileSize: body.videoFileSize,
      videoStoragePath: storagePath,
      videoUrl: null, // Will be set after upload completion
      videoDuration: body.videoDuration || 0,

      // Workflow state
      status: 'uploading',
      slaBreach: false,

      // Context from athlete
      athleteContext: body.athleteContext,
      athleteGoals: body.athleteGoals,
      specificQuestions: body.specificQuestions,

      // Metrics
      viewCount: 0,
      commentCount: 0,
      uploadProgress: 0,

      // Metadata
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      submittedAt: FieldValue.serverTimestamp(),
      slaDeadline: slaDeadline,
      version: 1,
    } as any;

    const docRef = await adminDb.collection('submissions').add(submissionData);
    const submissionId = docRef.id;

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const athleteUid = searchParams.get('athleteUid');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query using Firebase Admin SDK
    let query: any = adminDb.collection('submissions');

    // Apply filters
    if (athleteUid) {
      query = query.where('athleteUid', '==', athleteUid);
    }
    if (teamId) {
      query = query.where('teamId', '==', teamId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by creation date (newest first) and limit
    query = query.orderBy('createdAt', 'desc').limit(limit);

    // Execute query
    const snapshot = await query.get();
    
    // Convert documents to array
    const submissions = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt,
        slaDeadline: data.slaDeadline?.toDate?.()?.toISOString() || data.slaDeadline,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
      };
    });

    return NextResponse.json({
      submissions,
      total: submissions.length,
      hasMore: submissions.length === limit,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}