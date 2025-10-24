// Test script to check if the query works
const admin = require('firebase-admin');

// Initialize Firebase Admin (uses your service account)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testQuery() {
  try {
    console.log('Testing query for creatorUid: [ID]');

    const lessonsSnapshot = await db
      .collection('content')
      .where('creatorUid', '==', 'OQwohokow3NC9QTBLIFSoIK7AzRQ2')
      .orderBy('createdAt', 'desc')
      .get();

    console.log('Query succeeded!');
    console.log(`Found ${lessonsSnapshot.docs.length} lessons`);

    lessonsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Query FAILED:');
    console.error(error);
    process.exit(1);
  }
}

testQuery();
