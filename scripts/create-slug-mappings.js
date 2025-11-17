const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createSlugMappings() {
  try {
    console.log('\n🔧 Creating slug mappings for all coaches...\n');

    // Get all coaches
    const coachesSnapshot = await db.collection('users')
      .where('role', '==', 'coach')
      .get();

    console.log(`Found ${coachesSnapshot.size} coaches\n`);

    for (const coachDoc of coachesSnapshot.docs) {
      const coachData = coachDoc.data();
      const coachId = coachDoc.id;
      const slug = coachData.slug;

      console.log(`Coach: ${coachData.displayName || coachData.email}`);
      console.log(`  - UID: ${coachId}`);
      console.log(`  - Slug: ${slug || 'NO SLUG'}`);

      if (!slug) {
        console.log(`  - ⚠️ SKIPPING - No slug found`);
        console.log('');
        continue;
      }

      // Check if slug mapping already exists
      const mappingDoc = await db.collection('slug_mappings').doc(slug).get();

      if (mappingDoc.exists) {
        console.log(`  - ✅ Slug mapping already exists`);
        const mappingData = mappingDoc.data();
        console.log(`     Points to: ${mappingData.originalId}`);
      } else {
        console.log(`  - 💡 Creating slug mapping...`);

        await db.collection('slug_mappings').doc(slug).set({
          originalId: coachId,
          displayName: coachData.displayName || 'Coach',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUsed: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`  - ✅ Created slug mapping: ${slug} -> ${coachId}`);
      }

      console.log('');
    }

    console.log('✅ All slug mappings created!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

createSlugMappings();
