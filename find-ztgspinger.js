const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findUser() {
  try {
    // Search all users for this email (case variations)
    const allUsers = await db.collection('users').get();
    
    console.log(`\n🔍 Searching ${allUsers.size} total users for "ztgspinger"...`);
    
    allUsers.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase().includes('ztgspinger')) {
        console.log('\n✅ FOUND:');
        console.log('UID:', doc.id);
        console.log('Email:', data.email);
        console.log('DisplayName:', data.displayName);
        console.log('Role:', data.role);
        console.log('roleProtected:', data.roleProtected);
        console.log('roleSource:', data.roleSource);
        console.log('invitationRole:', data.invitationRole);
        console.log('manuallySetRole:', data.manuallySetRole);
      }
    });

    // Also check invitations
    const invitations = await db.collection('invitations').get();
    console.log(`\n📨 Checking ${invitations.size} invitations...`);
    
    invitations.forEach(doc => {
      const data = doc.data();
      if ((data.athleteEmail && data.athleteEmail.toLowerCase().includes('ztgspinger')) ||
          (data.coachEmail && data.coachEmail.toLowerCase().includes('ztgspinger'))) {
        console.log('\n✅ FOUND IN INVITATIONS:');
        console.log('ID:', doc.id);
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

findUser();
