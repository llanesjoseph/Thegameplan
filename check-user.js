const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
  try {
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'ztgspinger@gmail.com')
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No user found with email: ztgspinger@gmail.com');
      return;
    }

    usersSnapshot.forEach(doc => {
      console.log('\n📋 User Document:');
      console.log('UID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });

    // Check for athlete invitations
    const invitationsSnapshot = await db.collection('invitations')
      .where('athleteEmail', '==', 'ztgspinger@gmail.com')
      .get();

    console.log('\n📨 Athlete Invitations:', invitationsSnapshot.size);
    invitationsSnapshot.forEach(doc => {
      console.log('Invitation:', doc.id, doc.data());
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUser();
