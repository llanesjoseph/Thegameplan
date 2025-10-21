// FIX ALL ATHLETES - Set custom claims for ALL athletes in the system
// Run: npx ts-node scripts/fix-all-athletes.ts

import { auth, adminDb } from '../lib/firebase.admin';

async function fixAllAthletes() {
  try {
    console.log('\n🔧 FIXING ALL ATHLETES...\n');

    // Get all users with role='athlete'
    const athletesSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .get();

    console.log(`Found ${athletesSnapshot.size} athletes\n`);

    let fixed = 0;
    let errors = 0;

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
          fixed++;
        } else {
          console.log(`⏭️  Skip: ${data.email || data.displayName || uid} (already set)`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${uid}:`, error);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Skipped: ${athletesSnapshot.size - fixed - errors}`);
    console.log(`  Errors: ${errors}`);

    console.log('\n⚠️  IMPORTANT: All affected athletes must sign out and back in!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

fixAllAthletes();
