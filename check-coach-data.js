const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCoachData() {
  try {
    // Get Lona Vincent user data
    const coachId = 'xpXL0YsVg8U12roUXqTK7rUS6fs1';
    const user = await db.collection('users').doc(coachId).get();

    if (!user.exists) {
      console.log('Lona Vincent user not found');
      return;
    }
    console.log('===== COACH DATA AUDIT =====');
    console.log('Coach ID:', '[COACH_ID]');
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
      console.log('Catchphrases:', vpData.responsePatterns?.[ID]?.slice(0, 3) || []);
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

    // Check athletes with dual-field query
    console.log('\n===== ATHLETES =====');
    const [athletesByCoachId, athletesByAssignedCoachId] = await Promise.all([
      db.collection('users').where('coachId', '==', coachId).get(),
      db.collection('users').where('assignedCoachId', '==', coachId).get()
    ]);

    console.log('Athletes with coachId:', athletesByCoachId.size);
    console.log('Athletes with assignedCoachId:', athletesByAssignedCoachId.size);

    const athleteIds = new Set([
      ...athletesByCoachId.docs.map(d => d.id),
      ...athletesByAssignedCoachId.docs.map(d => d.id)
    ]);

    console.log('Total unique athletes:', athleteIds.size);
    athleteIds.forEach(id => {
      const doc = athletesByCoachId.docs.find(d => d.id === id) ||
                  athletesByAssignedCoachId.docs.find(d => d.id === id);
      const data = doc.data();
      console.log('  - ' + (data.displayName || data.email));
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCoachData();
