/**
 * Sync Lesson Counts for All Coaches
 *
 * This script updates the lessonCount field in the creators_index collection
 * to match the actual count of published lessons for each coach.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manually load .env.local file
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

// Initialize Firebase Admin
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

async function syncCoachLessonCounts() {
  try {
    console.log('🚀 Starting lesson count sync for all coaches...\n');

    // Get all active coaches from creators_index
    const coachesSnapshot = await db.collection('creators_index')
      .where('isActive', '==', true)
      .get();

    console.log(`📊 Found ${coachesSnapshot.size} active coaches\n`);

    let updated = 0;
    let failed = 0;
    let unchanged = 0;

    // Process each coach
    for (const coachDoc of coachesSnapshot.docs) {
      const coachId = coachDoc.id;
      const coachData = coachDoc.data();
      const currentLessonCount = coachData.lessonCount || 0;

      try {
        // Count published lessons for this coach
        const lessonsSnapshot = await db.collection('content')
          .where('creatorUid', '==', coachId)
          .where('status', '==', 'published')
          .get();

        const actualLessonCount = lessonsSnapshot.size;

        // Only update if the count has changed
        if (currentLessonCount !== actualLessonCount) {
          await db.doc(`creators_index/${coachId}`).update({
            lessonCount: actualLessonCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`✅ ${coachData.displayName || coachId}: ${currentLessonCount} → ${actualLessonCount} lessons`);
          updated++;
        } else {
          console.log(`⏭️  ${coachData.displayName || coachId}: ${actualLessonCount} lessons (no change)`);
          unchanged++;
        }

      } catch (error) {
        console.error(`❌ Failed to update ${coachData.displayName || coachId}:`, error.message);
        failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total coaches processed: ${coachesSnapshot.size}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Unchanged: ${unchanged}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ Lesson count sync complete!');

  } catch (error) {
    console.error('❌ Error during sync:', error);
    throw error;
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the sync
syncCoachLessonCounts()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
