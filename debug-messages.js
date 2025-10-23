const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugMessages() {
  try {
    console.log('🔍 Debugging messages collection...');
    
    // Check if messages collection exists and has any documents
    const messagesSnapshot = await db.collection('messages').limit(5).get();
    console.log(`📊 Found ${messagesSnapshot.size} messages in collection`);
    
    if (messagesSnapshot.size > 0) {
      console.log('📝 Sample messages:');
      messagesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     Coach ID: ${data.coachId}`);
        console.log(`     Athlete: ${data.athleteName}`);
        console.log(`     Subject: ${data.subject}`);
        console.log(`     Status: ${data.status}`);
        console.log(`     Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
        console.log('     ---');
      });
    }
    
    // Check for messages with a specific coach ID (Joseph's ID)
    const coachId = 'C9QTBLFSOIK7A2RQ2'; // From the error URL
    console.log(`\n🔍 Checking for messages for coach: ${coachId}`);
    
    try {
      const coachMessagesSnapshot = await db.collection('messages')
        .where('coachId', '==', coachId)
        .limit(5)
        .get();
      
      console.log(`📊 Found ${coachMessagesSnapshot.size} messages for coach ${coachId}`);
      
      if (coachMessagesSnapshot.size > 0) {
        coachMessagesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  ${index + 1}. ${data.subject} - ${data.status}`);
        });
      }
    } catch (queryError) {
      console.error('❌ Error querying messages by coachId:', queryError.message);
      console.log('💡 This might be a Firestore index issue. The collection might need an index for coachId + createdAt.');
    }
    
    // Check all users to see if we can find the coach
    console.log(`\n🔍 Checking users collection for coach: ${coachId}`);
    const userDoc = await db.collection('users').doc(coachId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`✅ Coach found: ${userData.displayName || userData.email} (${userData.role})`);
    } else {
      console.log(`❌ Coach not found in users collection`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging messages:', error);
  }
}

debugMessages().then(() => {
  console.log('✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
