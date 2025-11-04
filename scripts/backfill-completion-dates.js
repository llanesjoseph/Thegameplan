/**
 * Backfill Completion Dates for Existing Completed Lessons
 *
 * This script adds completion timestamps to existing completed lessons
 * in the athlete_feed collection. Since we don't have the actual completion
 * dates, we'll use a reasonable distribution based on lastActivity.
 */

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

async function backfillCompletionDates() {
  console.log('🚀 Starting completion dates backfill...\n');

  // Get all athlete_feed documents
  const feedsSnapshot = await db.collection('athlete_feed').get();

  console.log(`Found ${feedsSnapshot.size} athlete feeds\n`);

  let updated = 0;
  let skipped = 0;

  for (const feedDoc of feedsSnapshot.docs) {
    const athleteId = feedDoc.id;
    const feedData = feedDoc.data();

    const completedLessons = feedData.completedLessons || [];
    const existingCompletionDates = feedData.completionDates || {};

    if (completedLessons.length === 0) {
      console.log(`⏭️  Skipping ${athleteId} - no completed lessons`);
      skipped++;
      continue;
    }

    // Get user data for name
    const userDoc = await db.doc(`users/${athleteId}`).get();
    const userName = userDoc.exists ? userDoc.data().displayName : athleteId;

    // Check if we need to backfill
    const lessonsNeedingDates = completedLessons.filter(
      lessonId => !existingCompletionDates[lessonId]
    );

    if (lessonsNeedingDates.length === 0) {
      console.log(`✅ ${userName} - all ${completedLessons.length} lessons already have dates`);
      skipped++;
      continue;
    }

    console.log(`🔄 ${userName} - backfilling ${lessonsNeedingDates.length} completion dates`);

    // Use lastActivity as the most recent completion, or current time if not available
    const lastActivity = feedData.lastActivity || admin.firestore.Timestamp.now();
    const baseDate = lastActivity.toDate();

    // Distribute completions across recent days
    // Strategy: Spread them out over the past N days, with more recent bias
    const completionDates = { ...existingCompletionDates };

    lessonsNeedingDates.forEach((lessonId, index) => {
      // Distribute lessons backwards from lastActivity
      // Each lesson gets a date 0-N days before lastActivity
      const daysBack = Math.floor(index / 3); // Group 3 lessons per day
      const completionDate = new Date(baseDate);
      completionDate.setDate(completionDate.getDate() - daysBack);

      // Add some random hours to make it more realistic
      completionDate.setHours(
        Math.floor(Math.random() * 8) + 10, // Random hour between 10am-6pm
        Math.floor(Math.random() * 60) // Random minutes
      );

      completionDates[lessonId] = admin.firestore.Timestamp.fromDate(completionDate);
    });

    // Update the document
    await db.doc(`athlete_feed/${athleteId}`).update({
      completionDates
    });

    console.log(`  ✅ Updated ${lessonsNeedingDates.length} completion dates`);
    updated++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 BACKFILL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total feeds processed: ${feedsSnapshot.size}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log('='.repeat(60) + '\n');

  console.log('✅ Completion dates backfill complete!');

  await admin.app().delete();
}

backfillCompletionDates()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
