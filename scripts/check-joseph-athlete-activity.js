const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkJosephAthleteActivity() {
  console.log('=== CHECKING JOSEPH LLANES ATHLETE ACTIVITY ===\n');

  // Find Joseph Llanes
  const usersSnapshot = await db.collection('users')
    .where('email', '==', 'llanes.joseph.m@gmail.com')
    .get();

  if (usersSnapshot.empty) {
    console.log('Joseph Llanes not found!');
    return;
  }

  const josephDoc = usersSnapshot.docs[0];
  const josephId = josephDoc.id;
  const josephData = josephDoc.data();

  console.log('Joseph Llanes found:', {
    uid: josephId,
    email: josephData.email,
    role: josephData.role
  });

  // Find his athletes
  console.log('\n=== FINDING JOSEPH\'S ATHLETES ===');
  const athletesSnapshot = await db.collection('users')
    .where('coachId', '==', josephId)
    .get();

  console.log(`Found ${athletesSnapshot.size} athletes assigned to Joseph\n`);

  for (const athleteDoc of athletesSnapshot.docs) {
    const athleteId = athleteDoc.id;
    const athleteData = athleteDoc.data();

    console.log(`\n--- Athlete: ${athleteData.displayName || athleteData.email} ---`);
    console.log(`UID: ${athleteId}`);
    console.log(`Email: ${athleteData.email}`);
    console.log(`Role: ${athleteData.role}`);

    // Check video submissions (without orderBy to avoid index requirement)
    console.log('\n  VIDEO SUBMISSIONS:');
    const submissionsSnapshot = await db.collection('submissions')
      .where('athleteId', '==', athleteId)
      .limit(20)
      .get();

    if (submissionsSnapshot.empty) {
      console.log('  No submissions found');
    } else {
      console.log(`  Found ${submissionsSnapshot.size} submissions:`);
      const submissions = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()
      })).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

      submissions.forEach((sub, index) => {
        console.log(`    ${index + 1}. ${sub.id} - Status: ${sub.status || 'unknown'} - Created: ${sub.createdAt?.toISOString() || 'unknown'}`);
      });
    }

    // Check lesson progress
    console.log('\n  LESSON PROGRESS:');
    const feedDoc = await db.collection('athlete_feed').doc(athleteId).get();
    if (feedDoc.exists) {
      const feedData = feedDoc.data();
      console.log(`  Completed lessons: ${feedData.completedLessons?.length || 0}`);
      console.log(`  Total lessons: ${feedData.totalLessons || 0}`);
      console.log(`  Completion rate: ${feedData.completionRate || 0}%`);
    } else {
      console.log('  No feed document found');
    }

    // Check reviews
    console.log('\n  REVIEWS:');
    const reviewsSnapshot = await db.collection('reviews')
      .where('athleteId', '==', athleteId)
      .limit(10)
      .get();

    if (reviewsSnapshot.empty) {
      console.log('  No reviews found');
    } else {
      console.log(`  Found ${reviewsSnapshot.size} reviews:`);
      const reviews = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()
      })).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

      reviews.forEach((review, index) => {
        console.log(`    ${index + 1}. ${review.id} - Published: ${review.published || false} - Created: ${review.createdAt?.toISOString() || 'unknown'}`);
      });
    }
  }

  // Check submissions where coachId = josephId
  console.log('\n\n=== SUBMISSIONS ASSIGNED TO JOSEPH (by coachId) ===');
  const coachSubmissions = await db.collection('submissions')
    .where('coachId', '==', josephId)
    .limit(50)
    .get();

  if (coachSubmissions.empty) {
    console.log('No submissions found with coachId');
  } else {
    console.log(`Found ${coachSubmissions.size} submissions:`);
    const submissions = coachSubmissions.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()
    })).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    submissions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.id}`);
      console.log(`     Athlete: ${sub.athleteName || sub.athleteId}`);
      console.log(`     Status: ${sub.status || 'unknown'}`);
      console.log(`     Created: ${sub.createdAt?.toISOString() || 'unknown'}`);
      console.log(`     Claimed by: ${sub.claimedBy || 'nobody'}`);
    });
  }
}

checkJosephAthleteActivity()
  .then(() => {
    console.log('\n=== DONE ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
