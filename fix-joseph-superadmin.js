// Quick script to set Joseph's role to superadmin
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gameplan-787a2'
  });
}

const db = admin.firestore();

async function setJosephAsSuperadmin() {
  const userId = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2';
  const email = 'llanes.joseph.m@gmail.com';

  try {
    console.log('🔧 Setting superadmin role for:', email);

    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      role: 'superadmin',
      roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      roleUpdateReason: 'Manual superadmin assignment',
      lastRoleUpdate: new Date().toISOString()
    });

    console.log('✅ Successfully set role to superadmin');
    console.log('🔄 Please refresh your browser to see the changes');

    // Verify the update
    const doc = await userRef.get();
    const data = doc.data();
    console.log('Current role:', data.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating role:', error);
    process.exit(1);
  }
}

setJosephAsSuperadmin();
