// Script to create slug mapping for Lona Vincent's restored profile
// Usage: node scripts/fix-lona-slug.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const COACH_ID = 'HFstEWRA82aqNNuFrqWztIHy1Su1';
const DISPLAY_NAME = 'Lona Vincent';

function generateSlug(displayName, originalId) {
  // Clean the display name
  const cleanName = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Split into parts
  const nameParts = cleanName.split('-');

  if (nameParts.length >= 2) {
    // Use first and last name parts
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    // Add a short random string for uniqueness
    const randomSuffix = originalId.slice(-6); // Use last 6 chars of original ID

    return `${firstName}-${lastName}-${randomSuffix}`;
  } else {
    // Fallback for single name
    const randomSuffix = originalId.slice(-8); // Use last 8 chars for uniqueness
    return `${cleanName}-${randomSuffix}`;
  }
}

async function createSlugForLona() {
  console.log(`🔧 Creating slug mapping for Lona Vincent\n`);

  try {
    // Generate slug
    const slug = generateSlug(DISPLAY_NAME, COACH_ID);
    console.log(`Generated slug: ${slug}`);

    // Create slug mapping
    console.log('\n📋 Creating slug_mappings document...');
    await db.collection('slug_mappings').doc(slug).set({
      slug,
      originalId: COACH_ID,
      displayName: DISPLAY_NAME,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Slug mapping created');

    // Update creators_index with slug
    console.log('\n📋 Updating creators_index with slug...');
    await db.collection('creators_index').doc(COACH_ID).update({
      slug,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ creators_index updated');

    console.log('\n✅ Slug mapping complete!');
    console.log(`\nLona Vincent's profile is now accessible at:`);
    console.log(`  - https://playbookd.crucibleanalytics.dev/coach-profile/${slug}`);
    console.log(`\nOld URL (UID-based) will no longer work`);
    console.log(`  - https://playbookd.crucibleanalytics.dev/coach-profile/${COACH_ID} ❌`);

  } catch (error) {
    console.error('\n❌ Error creating slug mapping:', error);
    throw error;
  }
}

// Run the script
createSlugForLona()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
