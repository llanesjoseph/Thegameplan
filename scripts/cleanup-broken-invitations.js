/**
 * Clean up broken "accepted" invitations that don't have user accounts
 * This fixes invitations processed with the old buggy flow
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

(async () => {
  try {
    console.log('🔍 Finding broken invitations...\n');

    // Get all "accepted" invitations
    const invitationsSnapshot = await db.collection('invitations')
      .where('status', '==', 'accepted')
      .get();

    console.log(`📋 Found ${invitationsSnapshot.size} accepted invitations`);

    const broken = [];
    const fixed = [];

    for (const doc of invitationsSnapshot.docs) {
      const inv = doc.data();
      const email = inv.athleteEmail || inv.email;

      if (!email) {
        console.log(`⚠️ Invitation ${doc.id} has no email - skipping`);
        continue;
      }

      console.log(`\n🔍 Checking: ${email}`);

      // Check if user exists in Firebase Auth
      let authExists = false;
      let authUid = null;
      try {
        const userRecord = await auth.getUserByEmail(email.toLowerCase());
        authExists = true;
        authUid = userRecord.uid;
        console.log(`  ✅ Firebase Auth: exists (${authUid})`);
      } catch (error) {
        console.log(`  ❌ Firebase Auth: NOT found`);
      }

      // Check if user exists in Firestore users collection
      let firestoreExists = false;
      if (authUid) {
        const userDoc = await db.collection('users').doc(authUid).get();
        firestoreExists = userDoc.exists;
        console.log(`  ${firestoreExists ? '✅' : '❌'} Firestore users: ${firestoreExists ? 'exists' : 'NOT found'}`);
      }

      // If auth exists but Firestore doesn't, it's broken
      if (authExists && !firestoreExists) {
        broken.push({
          invitationId: doc.id,
          email,
          authUid,
          ...inv
        });
        console.log(`  🚨 BROKEN: Has auth but no Firestore user document`);
      } else if (authExists && firestoreExists) {
        fixed.push({ email, authUid });
        console.log(`  ✅ GOOD: Properly set up`);
      } else if (!authExists) {
        broken.push({
          invitationId: doc.id,
          email,
          authUid: null,
          ...inv
        });
        console.log(`  🚨 BROKEN: Marked accepted but no auth account exists`);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Properly set up: ${fixed.length}`);
    console.log(`🚨 Broken invitations: ${broken.length}\n`);

    if (broken.length > 0) {
      console.log('🚨 BROKEN INVITATIONS:');
      broken.forEach((b, i) => {
        console.log(`\n${i + 1}. ${b.email}`);
        console.log(`   Invitation ID: ${b.invitationId}`);
        console.log(`   Auth UID: ${b.authUid || 'NONE'}`);
        console.log(`   Status: ${b.status}`);
      });

      console.log('\n\n🛠️ RECOMMENDED ACTIONS:');
      console.log('1. Delete these broken invitations');
      console.log('2. Delete any Firebase Auth accounts (if they exist)');
      console.log('3. Re-send fresh invitations');
      console.log('4. Athletes complete onboarding with NEW fixed flow');

      console.log('\n\n🗑️ DELETE BROKEN DATA? (y/n)');

      // For now, just report - don't auto-delete
      console.log('\n⚠️ Run this script with --delete flag to clean up');

      if (process.argv.includes('--delete')) {
        console.log('\n🗑️ DELETING BROKEN DATA...\n');

        for (const b of broken) {
          console.log(`Deleting: ${b.email}`);

          // Delete Firebase Auth account if exists
          if (b.authUid) {
            try {
              await auth.deleteUser(b.authUid);
              console.log(`  ✅ Deleted Firebase Auth account`);
            } catch (error) {
              console.log(`  ⚠️ Could not delete auth: ${error.message}`);
            }
          }

          // Delete invitation
          await db.collection('invitations').doc(b.invitationId).delete();
          console.log(`  ✅ Deleted invitation`);

          // Delete any athlete document
          if (b.athleteId) {
            try {
              await db.collection('athletes').doc(b.athleteId).delete();
              console.log(`  ✅ Deleted athlete document`);
            } catch (error) {
              console.log(`  ⚠️ No athlete document to delete`);
            }
          }
        }

        console.log('\n✅ CLEANUP COMPLETE!');
        console.log('📧 You can now re-send invitations to these emails');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
