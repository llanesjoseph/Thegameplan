const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixLonaRole() {
  try {
    const lonaUid = 'HFstEWRA82aqNNuFrqWztIHy1Su1';
    
    console.log(`\n🔧 Fixing Lona's role...`);
    
    await db.collection('users').doc(lonaUid).update({
      role: 'admin',
      roleUpdatedAt: admin.firestore.Timestamp.now(),
      roleUpdateReason: 'Manual fix - enforced from invitationRole field'
    });
    
    console.log(`✅ FIXED: Lona's role updated to 'admin'`);
    
    // Verify the fix
    const userDoc = await db.collection('users').doc(lonaUid).get();
    const userData = userDoc.data();
    
    console.log('\n📋 Verification:');
    console.log('Role:', userData.role);
    console.log('invitationRole:', userData.invitationRole);
    console.log('Match:', userData.role === userData.invitationRole ? '✅' : '❌');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixLonaRole();
