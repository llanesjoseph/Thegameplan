const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAthleteProgress() {
  try {
    console.log('\n🔍 Checking athlete progress data...\n');

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
    const athleteId = athleteDoc.id;
    console.log('✅ Found athlete:');
    console.log('  - UID:', athleteId);
    console.log('  - Email:', athleteDoc.data().email);

    // Check athlete_feed document
    const feedDoc = await db.collection('athlete_feed').doc(athleteId).get();

    if (!feedDoc.exists) {
      console.log('\n❌ No athlete_feed document found for this athlete!');
      console.log('   This is why progress data is not showing correctly.');
      console.log('\n💡 Creating a basic athlete_feed document...');

      await db.collection('athlete_feed').doc(athleteId).set({
        lessons: [],
        completedLessons: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Created empty athlete_feed document');
      return;
    }

    const feedData = feedDoc.data();
    console.log('\n📊 Athlete Feed Data:');
    console.log('  - Total Lessons:', feedData.lessons?.length || 0);
    console.log('  - Completed Lessons:', feedData.completedLessons?.length || 0);
    console.log('  - In Progress:', Math.max(0, (feedData.lessons?.length || 0) - (feedData.completedLessons?.length || 0)));

    if (feedData.lessons && feedData.lessons.length > 0) {
      console.log('\n📚 Lessons:');
      feedData.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.title || lesson.id || 'Untitled'}`);
      });
    }

    if (feedData.completedLessons && feedData.completedLessons.length > 0) {
      console.log('\n✅ Completed Lessons:');
      feedData.completedLessons.forEach((lessonId, index) => {
        console.log(`  ${index + 1}. ${lessonId}`);
      });
    }

    // Check for upcoming events
    const userData = athleteDoc.data();
    const coachId = userData.coachId || userData.assignedCoachId;

    if (coachId) {
      console.log('\n📅 Checking upcoming events for coach:', coachId);
      const now = admin.firestore.Timestamp.now();
      const eventsSnapshot = await db.collection('coach_schedule')
        .where('coachId', '==', coachId)
        .where('eventDate', '>=', now)
        .get();

      console.log('  - Upcoming Events:', eventsSnapshot.size);

      if (eventsSnapshot.size > 0) {
        console.log('\n📋 Event Details:');
        eventsSnapshot.forEach((doc, index) => {
          const event = doc.data();
          console.log(`  ${index + 1}. ${event.title || 'Untitled Event'}`);
          console.log(`     Date: ${event.eventDate?.toDate()}`);
          console.log(`     Location: ${event.location || 'N/A'}`);
        });
      }
    } else {
      console.log('\n⚠️ No assigned coach found - cannot check events');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkAthleteProgress();
