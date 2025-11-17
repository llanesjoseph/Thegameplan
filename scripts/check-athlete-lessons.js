const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAthleteLessons() {
  try {
    // Find athlete by email
    const email = 'bigpenger@gmail.com';
    console.log(`\n🔍 Looking up athlete: ${email}`);

    const usersSnap = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnap.empty) {
      console.log('❌ No user found with that email');
      return;
    }

    const athleteDoc = usersSnap.docs[0];
    const athleteData = athleteDoc.data();
    const athleteId = athleteDoc.id;

    console.log(`\n✅ Found athlete: ${athleteData.displayName || athleteData.email}`);
    console.log(`   UID: ${athleteId}`);
    console.log(`   Role: ${athleteData.role}`);
    console.log(`   Assigned Coach ID: ${athleteData.coachId || athleteData.assignedCoachId || 'NONE'}`);

    // Get assigned coach
    const coachIds = [];
    const assignedCoachId = athleteData.coachId || athleteData.assignedCoachId;

    if (assignedCoachId) {
      coachIds.push(assignedCoachId);
      const coachDoc = await db.collection('users').doc(assignedCoachId).get();
      if (coachDoc.exists) {
        console.log(`\n📌 Assigned Coach: ${coachDoc.data().displayName || assignedCoachId}`);
      }
    }

    // Get followed coaches
    const followersSnap = await db.collection('coach_followers')
      .where('athleteId', '==', athleteId)
      .get();

    console.log(`\n👥 Followed Coaches: ${followersSnap.size}`);
    for (const doc of followersSnap.docs) {
      const followData = doc.data();
      if (!coachIds.includes(followData.coachId)) {
        coachIds.push(followData.coachId);
      }
      console.log(`   - ${followData.coachName || followData.coachId}`);
    }

    console.log(`\n📚 Total coaches to fetch lessons from: ${coachIds.length}`);

    // Fetch lessons from all coaches
    let totalLessons = 0;
    for (const coachId of coachIds) {
      const lessonsSnap = await db.collection('content')
        .where('creatorUid', '==', coachId)
        .where('status', '==', 'published')
        .get();

      console.log(`\n   Coach ${coachId}:`);
      console.log(`   └─ Published lessons: ${lessonsSnap.size}`);

      if (lessonsSnap.size > 0) {
        console.log(`      Sample lessons:`);
        lessonsSnap.docs.slice(0, 3).forEach(doc => {
          const lesson = doc.data();
          console.log(`      - ${lesson.title || 'Untitled'}`);
        });
      }

      totalLessons += lessonsSnap.size;
    }

    console.log(`\n✨ TOTAL LESSONS AVAILABLE: ${totalLessons}`);

    if (totalLessons === 0) {
      console.log('\n⚠️  NO LESSONS FOUND!');
      console.log('Possible causes:');
      console.log('1. Coaches have no published content');
      console.log('2. creatorUid field mismatch');
      console.log('3. status field is not "published"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAthleteLessons();
