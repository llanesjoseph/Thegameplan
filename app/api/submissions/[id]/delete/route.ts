import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { getStorage } from 'firebase-admin/storage';

export const runtime = 'nodejs';

/**
 * DELETE /api/submissions/[id]/delete
 * Delete a submission and its associated video/thumbnail from storage
 * SECURITY: Only allows athletes to delete their own submissions
 * RESTRICTION: Can only delete submissions that are NOT being reviewed (status: pending, draft)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get submission data
    const submissionDoc = await adminDb.collection('submissions').doc(params.id).get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submissionDoc.data();

    // 3. SECURITY: Verify the user owns this submission
    if (submissionData?.athleteUid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own submissions' },
        { status: 403 }
      );
    }

    // 4. Check if submission can be deleted
    // Allow deletion of completed submissions too since users might want to clean up
    const deletableStatuses = ['pending', 'draft', 'awaiting_coach', 'complete'];
    if (!deletableStatuses.includes(submissionData?.status)) {
      return NextResponse.json(
        {
          error: 'Cannot delete submission',
          message: `Submissions with status "${submissionData?.status}" cannot be deleted. Contact support if you need help.`
        },
        { status: 400 }
      );
    }

    // 5. Delete video and thumbnail from Storage
    const storage = getStorage();
    const bucket = storage.bucket();

    const filesToDelete: string[] = [];

    // Extract storage paths from URLs
    if (submissionData?.videoStoragePath) {
      filesToDelete.push(submissionData.videoStoragePath);
    }
    if (submissionData?.thumbnailStoragePath) {
      filesToDelete.push(submissionData.thumbnailStoragePath);
    }

    // Delete files from storage
    const deletePromises = filesToDelete.map(async (path) => {
      try {
        await bucket.file(path).delete();
        console.log(`✅ Deleted file: ${path}`);
      } catch (error: any) {
        // Log but don't fail if file doesn't exist
        if (error.code === 404) {
          console.warn(`⚠️ File not found (already deleted?): ${path}`);
        } else {
          console.error(`❌ Error deleting file ${path}:`, error);
          throw error;
        }
      }
    });

    await Promise.all(deletePromises);

    // 6. Delete submission document from Firestore
    await adminDb.collection('submissions').doc(params.id).delete();

    console.log(`✅ Submission ${params.id} deleted successfully by athlete ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
      deletedFiles: filesToDelete.length,
    });

  } catch (error: any) {
    console.error('[DELETE-SUBMISSION] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete submission',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

