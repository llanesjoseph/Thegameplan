const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

(async () => {
  try {
    // Find Elliott's user document
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'esaintil@gmail.com')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ Elliott not found');
      return;
    }

    const elliottDoc = usersSnapshot.docs[0];
    const elliottData = elliottDoc.data();

    console.log('\n📋 Elliott Saintil:');
    console.log('  UID:', elliottDoc.id);
    console.log('  Email:', elliottData.email);
    console.log('  Role:', elliottData.role);
    console.log('  Assigned Coach ID:', elliottData.assignedCoachId || elliottData.coachId || 'NONE');

    // Get the recent submission (the one from the email)
    const submissionSnapshot = await db.collection('submissions')
      .doc('xQBmi7m8jBj4dT4gMCyD')
      .get();

    if (submissionSnapshot.exists) {
      const subData = submissionSnapshot.data();
      console.log('\n📹 Submission xQBmi7m8jBj4dT4gMCyD:');
      console.log('  athleteUid:', subData.athleteUid);
      console.log('  athleteName:', subData.athleteName);
      console.log('  assignedCoachId:', subData.assignedCoachId || 'MISSING ❌');
      console.log('  coachId:', subData.coachId || 'MISSING ❌');
      console.log('  status:', subData.status);
    } else {
      console.log('\n❌ Submission xQBmi7m8jBj4dT4gMCyD not found');
    }

    // Get Merline's info
    const coachId = elliottData.assignedCoachId || elliottData.coachId;
    if (coachId) {
      const coachDoc = await db.collection('users').doc(coachId).get();
      if (coachDoc.exists) {
        const coachData = coachDoc.data();
        console.log('\n👤 Assigned Coach (Should be Merline):');
        console.log('  UID:', coachDoc.id);
        console.log('  Email:', coachData.email);
        console.log('  Name:', coachData.displayName || 'N/A');
        console.log('  Role:', coachData.role);
      } else {
        console.log('\n❌ Assigned coach not found in database');
      }
    } else {
      console.log('\n❌ Elliott has NO assigned coach in user document!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
})();
