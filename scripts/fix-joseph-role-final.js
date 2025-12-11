/**
 * Fix Joseph's role to coach (FINAL FIX)
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
    const email = 'llanes.joseph.m@gmail.com';
    console.log(`🔍 Checking role for: ${email}\n`);

    // Get user from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`UID: ${uid}`);
    console.log(`Email: ${userRecord.email}`);
    console.log(`Custom Claims:`, userRecord.customClaims);

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`\n📄 Firestore Data:`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Display Name: ${userData.displayName}`);
      console.log(`  Created At: ${userData.createdAt?.toDate()}`);
      console.log(`  Role Source: ${userData.roleSource || 'none'}`);
      console.log(`  Manually Set: ${userData.manuallySetRole || false}`);

      if (userData.role !== 'coach') {
        console.log(`\n🚨 INCORRECT ROLE: ${userData.role} (should be 'coach')`);
        console.log(`\n🔧 FIXING NOW...\n`);

        // Fix custom claims
        await auth.setCustomUserClaims(uid, {
          role: 'coach',
          coach: true
        });
        console.log(`✅ Set custom claims: { role: 'coach', coach: true }`);

        // Fix Firestore document
        await db.collection('users').doc(uid).update({
          role: 'coach',
          invitationRole: 'coach',
          roleSource: 'manual_admin_fix_final',
          manuallySetRole: true,
          roleProtected: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Updated Firestore document`);

        console.log(`\n✅ ROLE FIXED!`);
        console.log(`\n🔄 NEXT STEPS:`);
        console.log(`1. Sign out completely`);
        console.log(`2. Clear browser cache (Ctrl+Shift+Delete)`);
        console.log(`3. Close all browser tabs`);
        console.log(`4. Sign in again`);
        console.log(`5. You should be redirected to coach dashboard\n`);
      } else {
        console.log(`\n✅ Role is correct: coach`);
        console.log(`\nIf you're still seeing the athlete dashboard:`);
        console.log(`1. Sign out`);
        console.log(`2. Clear browser cache`);
        console.log(`3. Clear localStorage (F12 > Application > Local Storage > Clear All)`);
        console.log(`4. Sign in again\n`);
      }
    } else {
      console.log(`\n❌ ERROR: No Firestore document found!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
