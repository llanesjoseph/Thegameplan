/**
 * AGGRESSIVE FIX: Force set coach role in both Firestore AND Firebase Auth custom claims
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
    console.log(`🚨 AGGRESSIVE FIX for ${email}`);

    // Get user from Auth
    const user = await auth.getUserByEmail(email);
    const uid = user.uid;

    console.log('\n📋 BEFORE:');
    const userDocBefore = await db.collection('users').doc(uid).get();
    console.log('  Firestore role:', userDocBefore.data()?.role);
    console.log('  Custom claims:', user.customClaims);

    // STEP 1: Set custom claims in Firebase Auth
    console.log('\n🔧 STEP 1: Setting custom claims...');
    await auth.setCustomUserClaims(uid, {
      role: 'coach',
      coach: true
    });
    console.log('✅ Custom claims set');

    // STEP 2: Force update Firestore with all protection flags
    console.log('\n🔧 STEP 2: Updating Firestore document...');
    await db.collection('users').doc(uid).set({
      role: 'coach',
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'manual_admin_fix',
      roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      displayName: 'Joseph Llanes',
      email: email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ Firestore updated');

    // STEP 3: Verify the changes
    console.log('\n📋 AFTER:');
    const userAfter = await auth.getUser(uid);
    const userDocAfter = await db.collection('users').doc(uid).get();
    console.log('  Firestore role:', userDocAfter.data()?.role);
    console.log('  Custom claims:', userAfter.customClaims);
    console.log('  Role protected:', userDocAfter.data()?.roleProtected);

    console.log('\n✅ AGGRESSIVE FIX COMPLETE!');
    console.log('🔄 NOW: Sign out and sign back in to refresh your token');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
