// Script to find Jasmine's profile
// Usage: node scripts/find-jasmine-profile.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findJasmineProfile() {
  console.log('🔍 Searching for Jasmine\'s profile...\n');

  try {
    // Search in users collection for anyone named Jasmine
    console.log('📋 Searching users collection...');
    const usersSnapshot = await db.collection('users')
      .where('displayName', '>=', 'Jasmine')
      .where('displayName', '<=', 'Jasmine\uf8ff')
      .get();

    if (!usersSnapshot.empty) {
      console.log(`\nFound ${usersSnapshot.docs.length} user(s) named Jasmine:\n`);

      for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        console.log('─────────────────────────────────────────');
        console.log(`Name: ${data.displayName}`);
        console.log(`Email: ${data.email}`);
        console.log(`Role: ${data.role}`);
        console.log(`UID: ${doc.id}`);
        console.log(`Active: ${data.isActive !== false ? 'Yes' : 'No'}`);

        // Check if they have a slug
        if (data.role === 'coach' || data.role === 'creator') {
          const creatorIndexDoc = await db.collection('creators_index').doc(doc.id).get();
          if (creatorIndexDoc.exists) {
            const creatorData = creatorIndexDoc.data();
            if (creatorData.slug) {
              console.log(`Profile URL: https://playbookd.crucibleanalytics.dev/coach-profile/${creatorData.slug}`);
            } else {
              console.log('⚠️  No slug found - profile may not be accessible');
            }
          } else {
            console.log('⚠️  Not in creators_index - profile not public');
          }
        }
        console.log('─────────────────────────────────────────\n');
      }
    } else {
      console.log('❌ No users found with name "Jasmine"');

      // Try case-insensitive search in creators_index
      console.log('\n📋 Searching creators_index...');
      const creatorsSnapshot = await db.collection('creators_index').get();

      const jasmineCreators = creatorsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.displayName && data.displayName.toLowerCase().includes('jasmine');
      });

      if (jasmineCreators.length > 0) {
        console.log(`\nFound ${jasmineCreators.length} coach(es) with Jasmine in name:\n`);

        for (const doc of jasmineCreators) {
          const data = doc.data();
          console.log('─────────────────────────────────────────');
          console.log(`Name: ${data.displayName}`);
          console.log(`UID: ${doc.id}`);
          console.log(`Sport: ${data.sport || 'Not specified'}`);
          console.log(`Active: ${data.isActive !== false ? 'Yes' : 'No'}`);
          if (data.slug) {
            console.log(`Profile URL: https://playbookd.crucibleanalytics.dev/coach-profile/${data.slug}`);
          } else {
            console.log('⚠️  No slug found - profile may not be accessible');
          }
          console.log('─────────────────────────────────────────\n');
        }
      } else {
        console.log('❌ No coaches found with "Jasmine" in name');
      }
    }

  } catch (error) {
    console.error('\n❌ Error searching for Jasmine:', error);
    throw error;
  }
}

// Run the script
findJasmineProfile()
  .then(() => {
    console.log('\n✅ Search completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Search failed:', error);
    process.exit(1);
  });
