/**
 * Check ALL invitations in the system
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
    const coachEmail = 'llanes.joseph.m@gmail.com';

    // Get coach UID
    const usersSnapshot = await db.collection('users')
      .where('email', '==', coachEmail)
      .limit(1)
      .get();

    const coachUid = usersSnapshot.docs[0].id;
    console.log(`👤 Coach UID: ${coachUid}`);

    console.log(`\n🔍 Checking ALL invitations for ${email}...`);

    // Check ALL invitations (not just pending)
    const allSnapshot = await db.collection('invitations')
      .where('athleteEmail', '==', email.toLowerCase())
      .get();

    console.log(`📋 Total invitations: ${allSnapshot.size}`);

    allSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n  ID: ${doc.id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  CreatorUid: ${data.creatorUid}`);
      console.log(`  Created: ${data.createdAt?.toDate()}`);
      console.log(`  Used: ${data.used}`);
    });

    // Check invitations FROM this coach
    console.log(`\n\n🔍 Checking invitations FROM coach ${coachEmail}...`);
    const coachSnapshot = await db.collection('invitations')
      .where('creatorUid', '==', coachUid)
      .where('athleteEmail', '==', email.toLowerCase())
      .get();

    console.log(`📋 Invitations from this coach: ${coachSnapshot.size}`);

    coachSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n  ID: ${doc.id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Used: ${data.used}`);
      console.log(`  Created: ${data.createdAt?.toDate()}`);
    });

    // Show pending invitations specifically
    console.log(`\n\n🔍 PENDING invitations from this coach...`);
    const pendingSnapshot = await db.collection('invitations')
      .where('creatorUid', '==', coachUid)
      .where('athleteEmail', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get();

    console.log(`📋 PENDING invitations: ${pendingSnapshot.size}`);

    if (pendingSnapshot.size > 0) {
      console.log('\n🗑️ DELETING PENDING INVITATIONS...');
      const batch = db.batch();
      pendingSnapshot.forEach(doc => {
        console.log(`  - Deleting: ${doc.id}`);
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('✅ DELETED!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
