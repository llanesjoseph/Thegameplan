import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

export async function POST(request: NextRequest) {
  try {
    // Get user from Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user document to determine role
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const role = userData?.role || 'athlete';

    // Set custom claims for Storage access
    await auth.setCustomUserClaims(uid, {
      role: role,
      athleteId: uid,
      athlete: role === 'athlete',
      coach: role === 'coach' || role === 'creator',
      creator: role === 'creator',
    });

    console.log(`Fixed custom claims for ${uid} with role: ${role}`);

    return NextResponse.json({
      success: true,
      uid,
      role,
      message: 'Custom claims updated. Please refresh and try again.'
    });
  } catch (error) {
    console.error('Error fixing custom claims:', error);
    return NextResponse.json(
      { error: 'Failed to fix custom claims' },
      { status: 500 }
    );
  }
}