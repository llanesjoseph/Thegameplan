/**
 * Fix llanes.joseph.m@gmail.com Coach Account
 *
 * The Firebase Auth UID is OQuvoho6w3NC9QTBLFSoIK7A2RQ2
 * We need to ensure this UID has the correct role in Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixLlanesAccount() {
  console.log('\n🔧 FIXING LLANES COACH ACCOUNT\n' + '='.repeat(60));

  const LLANES_AUTH_UID = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2';
  const LLANES_EMAIL = 'llanes.joseph.m@gmail.com';

  try {
    // Delete the fake joseph-coach-account document if it exists
    console.log('\n🗑️  Deleting fake joseph-coach-account document...');
    const fakeDocRef = db.collection('users').doc('joseph-coach-account');
    const fakeDoc = await fakeDocRef.get();

    if (fakeDoc.exists) {
      await fakeDocRef.delete();
      console.log('✅ Deleted fake document: joseph-coach-account');
    } else {
      console.log('ℹ️  Fake document does not exist (already deleted)');
    }

    // Create/update the REAL Firestore document with correct UID
    console.log('\n📝 Creating/updating correct Firestore document...');
    console.log('   UID:', LLANES_AUTH_UID);
    console.log('   Email:', LLANES_EMAIL);

    await db.collection('users').doc(LLANES_AUTH_UID).set({
      uid: LLANES_AUTH_UID,
      email: LLANES_EMAIL,
      displayName: 'Joseph Llanes',
      role: 'coach',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Firestore document created/updated');

    // Verify the document
    console.log('\n🔍 Verifying document...');
    const verifyDoc = await db.collection('users').doc(LLANES_AUTH_UID).get();

    if (verifyDoc.exists) {
      const data = verifyDoc.data();
      console.log('✅ Document verified!');
      console.log('   UID:', verifyDoc.id);
      console.log('   Email:', data.email);
      console.log('   Role:', data.role);
      console.log('   Display Name:', data.displayName);
    } else {
      console.log('❌ Document not found after creation!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNow sign out and sign back in with llanes.joseph.m@gmail.com');
    console.log('You should be redirected to /dashboard/coach-unified\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the fix
(async () => {
  try {
    await fixLlanesAccount();
    process.exit(0);
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
})();
