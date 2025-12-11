const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCreatorsIndex() {
  try {
    console.log('\n🔍 Checking creators_index entries for coaches...\n');

    // Get all coaches
    const coachesSnapshot = await db.collection('users')
      .where('role', '==', 'coach')
      .get();

    console.log(`Found ${coachesSnapshot.size} coaches\n`);

    for (const coachDoc of coachesSnapshot.docs) {
      const coachData = coachDoc.data();
      const coachId = coachDoc.id;

      console.log(`Coach: ${coachData.displayName || coachData.email}`);
      console.log(`  - UID: ${coachId}`);
      console.log(`  - Slug: ${coachData.slug || 'NO SLUG'}`);

      // Check if they have a creators_index entry
      const creatorIndexDoc = await db.collection('creators_index').doc(coachId).get();

      if (creatorIndexDoc.exists) {
        console.log(`  - ✅ Has creators_index entry`);
        const creatorData = creatorIndexDoc.data();
        console.log(`     Bio: ${creatorData.bio ? 'Yes' : 'No'}`);
        console.log(`     Sport: ${creatorData.sport || 'Not set'}`);
      } else {
        console.log(`  - ❌ NO creators_index entry`);
        console.log(`  - 💡 Creating basic creators_index entry...`);

        await db.collection('creators_index').doc(coachId).set({
          displayName: coachData.displayName || 'Coach',
          bio: coachData.bio || '',
          sport: coachData.sport || 'General',
          experience: coachData.yearsExperience || '0',
          specialties: coachData.specialties || [],
          credentials: coachData.certifications || '',
          achievements: coachData.achievements || '',
          headshotUrl: coachData.photoURL || '',
          heroImageUrl: coachData.coverImageUrl || '',
          tagline: coachData.tagline || coachData.title || '',
          verified: coachData.verified || false,
          featured: coachData.featured || false,
          isActive: true,
          profileComplete: true,
          status: 'published',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`     ✅ Created creators_index entry`);
      }

      console.log('');
    }

    console.log('✅ All coaches checked!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkCreatorsIndex();
