const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkLona() {
  try {
    // Find Lona's user documents
    const usersSnapshot = await db.collection('users')
      .where('displayName', '==', 'Lona Vincent')
      .get();

    console.log(`\n📋 Found ${usersSnapshot.size} users named "Lona Vincent":`);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n========================================');
      console.log('UID:', doc.id);
      console.log('Email:', data.email);
      console.log('Role:', data.role);
      console.log('invitationRole:', data.invitationRole);
      console.log('roleProtected:', data.roleProtected);
      console.log('manuallySetRole:', data.manuallySetRole);
      console.log('roleSource:', data.roleSource);
      console.log('[ID]:', data.[ID]);
      console.log('createdAt:', data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt);
      console.log('========================================');
    });

    // Check admin invitations for Lona
    const adminInvitationsSnapshot = await db.collection('admin_invitations')
      .where('recipientName', '==', 'Lona Vincent')
      .get();

    console.log(`\n📨 Found ${[ID].size} admin invitations for Lona Vincent:`);
    
    adminInvitationsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n---');
      console.log('Code:', data.code);
      console.log('Email:', data.recipientEmail);
      console.log('Role:', data.role);
      console.log('Status:', data.status);
      console.log('Used:', data.usedBy);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkLona();
