const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixLona() {
  const lonaUid = 'HFstEWRA82aqNNuFrqWztIHy1Su1';
  
  console.log('🔧 Fixing Lona\'s role to admin...');
  
  await db.collection('users').doc(lonaUid).update({
    role: 'admin',
    roleUpdatedAt: admin.firestore.Timestamp.now(),
    roleUpdateReason: 'Manual fix - awaiting Cloud Function deployment'
  });
  
  console.log('✅ FIXED: Lona role = admin');
  console.log('⚠️  Deploy Cloud Functions ASAP to prevent reset!');
  
  process.exit(0);
}

fixLona();
