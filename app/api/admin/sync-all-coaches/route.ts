import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse';

/**
 * POST /api/admin/sync-all-coaches
 * Manually syncs all coach profiles to creators_index
 * This is useful for fixing existing coaches that may be out of sync
 * 
 * Requires: admin or superadmin role
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const adminUid = decodedToken.uid;

    // 2. Verify admin role
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    const adminData = adminDoc.data();
    const adminRole = adminData?.role || adminData?.roles?.[0] || 'user';

    if (!['admin', 'superadmin'].includes(adminRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 3. Get all coaches from creator_profiles
    const coachesSnapshot = await adminDb
      .collection('creator_profiles')
      .get();

    const results = {
      total: coachesSnapshot.docs.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 4. Sync each coach
    for (const coachDoc of coachesSnapshot.docs) {
      const coachUid = coachDoc.id;
      try {
        const syncResult = await syncCoachToBrowseCoaches(coachUid);
        if (syncResult.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`${coachUid}: ${syncResult.error}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${coachUid}: ${error.message}`);
      }
    }

    console.log(`✅ [SYNC-ALL-COACHES] Synced ${results.successful}/${results.total} coaches`);

    return NextResponse.json({
      success: true,
      message: `Synced ${results.successful}/${results.total} coaches to Browse Coaches`,
      results,
    });

  } catch (error: any) {
    console.error('Error syncing all coaches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync coaches' },
      { status: 500 }
    );
  }
}

