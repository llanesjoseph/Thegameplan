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
    // Get Merline's UID
    const merlineSnapshot = await db.collection('users')
      .where('email', '==', 'merlinesaintil@gmail.com')
      .limit(1)
      .get();

    if (merlineSnapshot.empty) {
      console.log('❌ Merline not found');
      return;
    }

    const merlineDoc = merlineSnapshot.docs[0];
    const merlineUid = merlineDoc.id;

    console.log('👤 Merline UID:', merlineUid);

    // Query submissions as the coach dashboard would
    const coachQueueQuery = db.collection('submissions')
      .where('coachId', '==', merlineUid)
      .where('status', '==', 'awaiting_coach');

    const queueSnapshot = await coachQueueQuery.get();

    console.log('\n📋 Submissions in Merline\'s Queue:');
    console.log('  Total count:', queueSnapshot.size);

    if (queueSnapshot.empty) {
      console.log('  ⚠️ No submissions found in queue');
    } else {
      queueSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('\n  ✅ Submission:', doc.id);
        console.log('     Athlete:', data.athleteName);
        console.log('     Status:', data.status);
        console.log('     coachId:', data.coachId);
        console.log('     assignedCoachId:', data.assignedCoachId || 'N/A');
        console.log('     Created:', data.createdAt?.toDate?.());
      });
    }

    // Specifically check Elliott's submission
    console.log('\n🎯 Checking Elliott\'s specific submission:');
    const elliottSubmission = await db.collection('submissions')
      .doc('xQBmi7m8jBj4dT4gMCyD')
      .get();

    if (elliottSubmission.exists) {
      const data = elliottSubmission.data();
      console.log('  ID:', elliottSubmission.id);
      console.log('  Athlete:', data.athleteName);
      console.log('  Status:', data.status);
      console.log('  coachId:', data.coachId);
      console.log('  assignedCoachId:', data.assignedCoachId);

      const willShowInQueue =
        data.coachId === merlineUid &&
        data.status === 'awaiting_coach';

      console.log('\n  Will show in Merline\'s queue?', willShowInQueue ? '✅ YES' : '❌ NO');

      if (!willShowInQueue) {
        if (data.coachId !== merlineUid) {
          console.log('    ❌ coachId mismatch:', data.coachId, '!==', merlineUid);
        }
        if (data.status !== 'awaiting_coach') {
          console.log('    ❌ Status is:', data.status, '(expected: awaiting_coach)');
        }
      }
    } else {
      console.log('  ❌ Submission not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
})();
