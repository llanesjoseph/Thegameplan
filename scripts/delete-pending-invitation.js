/**
 * Delete pending invitation so you can send a new one
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

(async () => {
  try {
    const email = 'crucibleatete1@yahoo.com';
    console.log(`🗑️ Deleting pending invitations for ${email}...`);

    // Find all pending invitations for this email
    const snapshot = await db.collection('invitations')
      .where('athleteEmail', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get();

    console.log(`📋 Found ${snapshot.size} pending invitation(s)`);

    if (snapshot.empty) {
      console.log('✅ No pending invitations to delete');
      process.exit(0);
      return;
    }

    // Delete each invitation
    const batch = db.batch();
    snapshot.forEach(doc => {
      console.log(`  - Deleting invitation: ${doc.id}`);
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Deleted ${snapshot.size} invitation(s)`);
    console.log('🎯 You can now send a new invitation to this email');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
