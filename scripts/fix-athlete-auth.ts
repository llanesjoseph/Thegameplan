// EMERGENCY FIX: Set custom claims for athlete so storage upload works
// Run: npx ts-node scripts/fix-athlete-auth.ts joseph@example.com

import { auth, adminDb } from '../lib/firebase.admin';

async function fixAthleteAuth(email: string) {
  try {
    console.log(`\n🔧 FIXING AUTH FOR: ${email}\n`);

    // Get user from Firestore
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User not found in Firestore');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;

    console.log('Found user:');
    console.log('  UID:', uid);
    console.log('  Firestore Role:', userData.role);
    console.log('  Coach ID:', userData.coachId || userData.assignedCoachId || 'NONE');

    // Get Firebase Auth user
    const userRecord = await auth.getUser(uid);
    console.log('\nCurrent Custom Claims:', userRecord.customClaims || 'NONE SET ❌');

    // Set custom claims
    console.log('\n🔧 Setting custom claims...');
    await auth.setCustomUserClaims(uid, {
      role: userData.role || 'athlete',
      athleteId: uid,
    });

    console.log('✅ Custom claims set!');

    // Verify
    const updatedUser = await auth.getUser(uid);
    console.log('New Custom Claims:', updatedUser.customClaims);

    console.log('\n✅ FIXED! User must sign out and sign back in for changes to take effect.');
    console.log('\nTell the athlete to:');
    console.log('1. Sign out completely');
    console.log('2. Sign back in');
    console.log('3. Try uploading video again');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: npx ts-node scripts/fix-athlete-auth.ts <athlete-email>');
  process.exit(1);
}

fixAthleteAuth(email);
