const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkLessons() {
  try {
    console.log('Checking content collection for your user...\n');
    
    const snapshot = await db.collection('content')
      .where('creatorUid', '==', 'OQwohokow3NC9QTBLIFSoIK7AzRQ2')
      .get();
    
    console.log(`Found ${snapshot.docs.length} lessons\n`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Lesson: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Status: ${data.status || 'NO STATUS FIELD'}`);
      console.log(`  CreatorUid: ${data.creatorUid}`);
      console.log(`  CreatedAt: ${data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : 'NO DATE'}`);
      console.log('---\n');
    });
    
    const draftCount = snapshot.docs.filter(doc => doc.data().status === 'draft').length;
    const publishedCount = snapshot.docs.filter(doc => doc.data().status === 'published').length;
    const noStatusCount = snapshot.docs.filter(doc => !doc.data().status).length;
    
    console.log('SUMMARY:');
    console.log(`  Draft: ${draftCount}`);
    console.log(`  Published: ${publishedCount}`);
    console.log(`  No Status: ${noStatusCount}`);
    console.log(`  Total: ${snapshot.docs.length}`);
    
    if (draftCount > 0) {
      console.log('\n⚠️  PROBLEM FOUND: You have draft lessons that won\'t show on the frontend!');
      console.log('   The frontend only shows lessons with status="published"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLessons();
