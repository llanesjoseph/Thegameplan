const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCoachId() {
  try {
    console.log('🔍 Checking coach IDs...');
    
    // Check the message that exists
    const messagesSnapshot = await db.collection('messages').get();
    console.log(`📊 Found ${messagesSnapshot.size} messages total`);
    
    messagesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Message ID: ${doc.id}`);
      console.log(`     Coach ID in message: ${data.coachId}`);
      console.log(`     Athlete: ${data.athleteName}`);
      console.log(`     Subject: ${data.subject}`);
      console.log('     ---');
    });
    
    // Check users collection for coaches
    console.log('\n🔍 Checking users collection for coaches...');
    const usersSnapshot = await db.collection('users').where('role', '==', 'coach').get();
    console.log(`📊 Found ${usersSnapshot.size} coaches`);
    
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Coach ID: ${doc.id}`);
      console.log(`     Name: ${data.displayName || data.email}`);
      console.log(`     Email: ${data.email}`);
      console.log('     ---');
    });
    
    // Check for Joseph specifically
    console.log('\n🔍 Looking for Joseph...');
    const josephSnapshot = await db.collection('users').where('email', '==', 'llanes.joseph.m@gmail.com').get();
    if (josephSnapshot.size > 0) {
      josephSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`✅ Joseph found: ${doc.id}`);
        console.log(`   Name: ${data.displayName}`);
        console.log(`   Role: ${data.role}`);
        console.log(`   Email: ${data.email}`);
      });
    } else {
      console.log('❌ Joseph not found by email');
    }
    
  } catch (error) {
    console.error('❌ Error checking coach IDs:', error);
  }
}

checkCoachId().then(() => {
  console.log('✅ Check complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
