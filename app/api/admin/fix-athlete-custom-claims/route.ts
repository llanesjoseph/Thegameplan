import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebase.admin';

async function fixAthleteCustomClaims() {
  console.log('🔧 FIXING ALL ATHLETE CUSTOM CLAIMS...\n');

  // Get all users with role='athlete'
  const athletesSnapshot = await adminDb
    .collection('users')
    .where('role', '==', 'athlete')
    .get();

  console.log(`Found ${athletesSnapshot.size} athletes`);

  const results = {
    total: athletesSnapshot.size,
    fixed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const doc of athletesSnapshot.docs) {
    const data = doc.data();
    const uid = doc.id;

    try {
      // Check current custom claims
      const userRecord = await auth.getUser(uid);
      const currentClaims = userRecord.customClaims || {};

      // Only update if role is not set or wrong
      if (currentClaims.role !== 'athlete') {
        await auth.setCustomUserClaims(uid, {
          ...currentClaims,
          role: 'athlete',
          athleteId: uid,
        });

        console.log(`✅ Fixed: ${data.email || data.displayName || uid}`);
        results.fixed++;
      } else {
        console.log(`⏭️  Skip: ${data.email || data.displayName || uid}`);
        results.skipped++;
      }
    } catch (error) {
      const msg = `Error fixing ${data.email || uid}: ${error}`;
      console.error(`❌ ${msg}`);
      results.errors.push(msg);
    }
  }

  console.log(`\n📊 Summary: Fixed ${results.fixed}, Skipped ${results.skipped}, Errors ${results.errors.length}`);

  return {
    success: true,
    message: 'Athlete custom claims fixed',
    results,
    warning: 'Athletes must sign out and back in for changes to take effect',
  };
}

export async function POST(request: NextRequest) {
  try {
    const result = await fixAthleteCustomClaims();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to fix custom claims', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await fixAthleteCustomClaims();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to fix custom claims', details: String(error) },
      { status: 500 }
    );
  }
}
