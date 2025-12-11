const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCoachFollowers() {
  try {
    console.log('\n🔍 Checking coach_followers collection...\n');

    // Find the athlete by email
    const athleteEmail = 'bigpenger@gmail.com';
    const usersSnapshot = await db.collection('users')
      .where('email', '==', athleteEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ Athlete not found with email:', athleteEmail);
      return;
    }

    const athleteDoc = usersSnapshot.docs[0];
    console.log('✅ Found athlete:');
    console.log('  - UID:', athleteDoc.id);
    console.log('  - Email:', athleteDoc.data().email);

    // Check coach_followers for this athlete
    const followersSnapshot = await db.collection('coach_followers')
      .where('athleteId', '==', athleteDoc.id)
      .get();

    console.log(`\n📊 Found ${followersSnapshot.size} coach_followers documents for this athlete\n`);

    if (followersSnapshot.empty) {
      console.log('❌ No followed coaches found!');
      console.log('\n🔍 Let me check ALL documents in coach_followers collection...\n');

      const allFollowersSnapshot = await db.collection('coach_followers').get();
      console.log(`Total documents in coach_followers: ${allFollowersSnapshot.size}\n`);

      allFollowersSnapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
        console.log('---');
      });
    } else {
      followersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`✅ Following coach:`);
        console.log(`  - Document ID: ${doc.id}`);
        console.log(`  - Coach ID: ${data.coachId}`);
        console.log(`  - Coach Name: ${data.coachName || 'N/A'}`);
        console.log(`  - Followed At: ${data.followedAt?.toDate?.()}`);
        console.log(`  - Notifications: ${data.notificationsEnabled || false}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCoachFollowers();
