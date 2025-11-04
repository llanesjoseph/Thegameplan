const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+?)[=:](.*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'gameplan-787a2'
    });
  }
}

const db = admin.firestore();

/**
 * Generate a secure, URL-friendly slug from a display name
 */
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

async function createSlugMapping(originalId, displayName) {
  try {
    const slug = generateSlug(displayName, originalId);

    // Check if slug already exists
    const existingSlug = await db.collection('slug_mappings').doc(slug).get();

    if (existingSlug.exists) {
      const existingData = existingSlug.data();
      if (existingData?.originalId !== originalId) {
        // Slug exists for different creator, generate new one with timestamp
        const newSlug = generateSlug(displayName, originalId + Date.now().toString());
        console.log(`  ⚠️  Slug collision, using: ${newSlug}`);
        return await createSlugMapping(originalId, displayName + Date.now());
      } else {
        console.log(`  ℹ️  Slug already exists for this coach`);
        return { success: true, slug };
      }
    }

    // Create slug mapping
    await db.collection('slug_mappings').doc(slug).set({
      slug,
      originalId,
      displayName,
      type: 'coach',
      createdAt: new Date(),
      lastUsed: new Date()
    }, { merge: true });

    // Update the creator's profile with the slug
    await db.collection('creators_index').doc(originalId).update({
      slug,
      lastUpdated: new Date()
    });

    console.log(`  ✅ Created slug: ${slug}`);

    return { success: true, slug };
  } catch (error) {
    console.error(`  ❌ Error creating slug:`, error.message);
    return { success: false, slug: '', error: error.message };
  }
}

async function migrateCoachesToSlugs() {
  console.log('🔄 Creating slug mappings for all coaches...\n');

  const creatorsSnapshot = await db.collection('creators_index').get();
  const errors = [];
  let migrated = 0;
  let skipped = 0;

  for (const doc of creatorsSnapshot.docs) {
    try {
      const creatorData = doc.data();
      const originalId = doc.id;
      const displayName = creatorData.displayName || creatorData.name || 'Unknown Creator';

      console.log(`\nProcessing: ${displayName} (${originalId})`);

      // Check if slug already exists
      if (creatorData.slug) {
        console.log(`  ℹ️  Already has slug: ${creatorData.slug}`);
        skipped++;
        continue;
      }

      const slugResult = await createSlugMapping(originalId, displayName);

      if (slugResult.success) {
        migrated++;
      } else {
        errors.push(`Failed to migrate ${displayName}: ${slugResult.error}`);
      }
    } catch (error) {
      const errorMsg = `Error migrating creator ${doc.id}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`  ❌ ${errorMsg}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`✅ Migrated: ${migrated}`);
  console.log(`⏭️  Skipped (already had slugs): ${skipped}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  await admin.app().delete();
}

migrateCoachesToSlugs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
