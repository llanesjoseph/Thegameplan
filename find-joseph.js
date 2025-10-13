const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findJoseph() {
  try {
    // Get all users named joseph
    const usersSnapshot = await db.collection('users')
      .where('displayName', '==', 'joseph llanes')
      .get();

    console.log(`\n📋 Found ${usersSnapshot.size} users named "joseph llanes":`);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n---');
      console.log('UID:', doc.id);
      console.log('Email:', data.email);
      console.log('Role:', data.role);
      console.log('roleProtected:', data.roleProtected);
      console.log('roleSource:', data.roleSource);
      console.log('invitationRole:', data.invitationRole);
    });

    // Also check with lowercase
    const usersSnapshot2 = await db.collection('users')
      .where('displayName', '==', 'Joseph Llanes')
      .get();

    console.log(`\n📋 Found ${usersSnapshot2.size} users named "Joseph Llanes" (capitalized):`);
    
    usersSnapshot2.forEach(doc => {
      const data = doc.data();
      console.log('\n---');
      console.log('UID:', doc.id);
      console.log('Email:', data.email);
      console.log('Role:', data.role);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

findJoseph();
