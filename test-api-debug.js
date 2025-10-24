// Test script to debug the API endpoint
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-key.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function testSubmissionsAPI() {
  try {
    console.log('🔍 Testing submissions collection...');
    
    // Test 1: Check if submissions collection exists and has data
    const submissionsSnapshot = await db.collection('submissions').limit(5).get();
    console.log(`📊 Found ${submissionsSnapshot.size} submissions`);
    
    if (submissionsSnapshot.size > 0) {
      submissionsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📝 Submission ${index + 1}: ${doc.id}`);
        console.log(`   Status: ${data.status || 'unknown'}`);
        console.log(`   Athlete UID: ${data.athleteUid || 'MISSING'}`);
        console.log(`   Video URL: ${data.videoUrl ? 'EXISTS' : 'MISSING'}`);
        console.log(`   Created At: ${data.createdAt ? 'EXISTS' : 'MISSING'}`);
        console.log('---');
      });
    }
    
    // Test 2: Check for any submissions with missing athleteUid
    const allSubmissions = await db.collection('submissions').get();
    let missingAthleteUid = 0;
    let missingVideoUrl = 0;
    
    allSubmissions.forEach(doc => {
      const data = doc.data();
      if (!data.athleteUid) missingAthleteUid++;
      if (!data.videoUrl) missingVideoUrl++;
    });
    
    console.log(`⚠️  Submissions missing athleteUid: ${missingAthleteUid}`);
    console.log(`⚠️  Submissions missing videoUrl: ${missingVideoUrl}`);
    
    // Test 3: Check reviews collection
    console.log('\n🔍 Testing reviews collection...');
    const reviewsSnapshot = await db.collection('reviews').limit(3).get();
    console.log(`📊 Found ${reviewsSnapshot.size} reviews`);
    
    // Test 4: Check comments collection
    console.log('\n🔍 Testing comments collection...');
    const commentsSnapshot = await db.collection('comments').limit(3).get();
    console.log(`📊 Found ${commentsSnapshot.size} comments`);
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testSubmissionsAPI().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
