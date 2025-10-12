const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCoachData() {
  try {
    // Get Joseph Llanes user data
    const usersSnap = await db.collection('users')
      .where('email', '==', 'jiu_jitsu_coaching@gmail.com')
      .limit(1)
      .get();

    if (usersSnap.empty) {
      console.log('Joseph Llanes user not found');
      return;
    }

    const user = usersSnap.docs[0];
    const coachId = user.id;
    console.log('===== COACH DATA AUDIT =====');
    console.log('Coach ID:', coachId);
    console.log('Display Name:', user.data().displayName);
    console.log('Sport:', user.data().sport);
    console.log('Bio:', user.data().bio?.substring(0, 100) + '...');

    // Check voice profile
    const voiceProfile = await db.collection('coach_voice_profiles').doc(coachId).get();
    console.log('\n===== VOICE PROFILE =====');
    console.log('Exists:', voiceProfile.exists);
    if (voiceProfile.exists) {
      const vpData = voiceProfile.data();
      console.log('Completeness Score:', vpData.completenessScore + '%');
      console.log('Specialties:', vpData.technicalAuthority?.specialtyAreas || []);
      console.log('Catchphrases:', vpData.responsePatterns?.encouragementPatterns?.slice(0, 3) || []);
    }

    // Check creator profile
    const creatorProfile = await db.collection('creator_profiles').doc(coachId).get();
    console.log('\n===== CREATOR PROFILE =====');
    console.log('Exists:', creatorProfile.exists);
    if (creatorProfile.exists) {
      console.log('Specialties:', creatorProfile.data().specialties || []);
    }

    // Check lessons content
    const lessons = await db.collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .limit(5)
      .get();

    console.log('\n===== PUBLISHED LESSONS =====');
    console.log('Total:', lessons.size);
    lessons.forEach(lesson => {
      const data = lesson.data();
      console.log('\nLesson:', data.title);
      console.log('  - Has content:', !!(data.content));
      console.log('  - Has longDescription:', !!(data.longDescription));
      console.log('  - Has sections:', data.sections?.length || 0);
      if (data.sections && data.sections[0]?.content) {
        console.log('  - First section content length:', data.sections[0].content.length);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCoachData();
