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
    // Get user custom claims
    const user = await auth.getUserByEmail('llanes.joseph.m@gmail.com');
    console.log('📋 Firebase Auth Custom Claims:');
    console.log('  UID:', user.uid);
    console.log('  Email:', user.email);
    console.log('  Custom Claims:', JSON.stringify(user.customClaims || {}, null, 2));

    // Get Firestore user document
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('\n📄 Firestore User Document:');
      console.log('  role:', userData.role);
      console.log('  roles:', userData.roles);
      console.log('  displayName:', userData.displayName);
      console.log('  onboardingComplete:', userData.onboardingComplete);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
