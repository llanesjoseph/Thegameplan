const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function createSlug(name, email) {
  // Create slug from email username if available
  if (email) {
    const username = email.split('@')[0];
    return username.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  // Fallback to name-based slug
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function createCoachSlugs() {
  try {
    console.log('\n🔧 Creating slugs for all coaches...\n');

    const coachesSnapshot = await db.collection('users')
      .where('role', '==', 'coach')
      .get();

    console.log(`Found ${coachesSnapshot.size} coaches\n`);

    for (const doc of coachesSnapshot.docs) {
      const data = doc.data();
      const slug = createSlug(data.displayName || 'coach', data.email);

      await db.collection('users').doc(doc.id).update({
        slug: slug
      });

      console.log(`✅ ${data.displayName || data.email}`);
      console.log(`   Slug: ${slug}`);
      console.log(`   UID: ${doc.id}\n`);
    }

    console.log('✅ All coach slugs created!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createCoachSlugs();
