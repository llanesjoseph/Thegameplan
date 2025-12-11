/**
 * Verify Streak Data
 *
 * Check that completion dates were properly backfilled and calculate
 * what the streak would be for each athlete.
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

function calculateStreak(completionDates) {
  if (!completionDates || Object.keys(completionDates).length === 0) {
    return 0;
  }

  // Convert completion timestamps to date strings
  const completionDateStrings = Object.values(completionDates)
    .map((timestamp) => {
      const date = timestamp.toDate();
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    })
    .filter((date) => date);

  if (completionDateStrings.length === 0) return 0;

  // Get unique dates sorted (most recent first)
  const uniqueDates = [...new Set(completionDateStrings)].sort().reverse();

  // Calculate consecutive days from today/yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Start streak from today or yesterday
  let streakStart = -1;
  if (uniqueDates.includes(todayStr)) {
    streakStart = 0; // Start from today
  } else if (uniqueDates.includes(yesterdayStr)) {
    streakStart = 1; // Start from yesterday
  } else {
    return 0; // No recent activity
  }

  // Count consecutive days backwards
  let streak = 1;
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - streakStart);

  for (let i = streakStart; i < uniqueDates.length; i++) {
    const expectedDateStr = currentDate.toISOString().split('T')[0];

    if (uniqueDates[i] === expectedDateStr) {
      if (i > streakStart) streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

async function verifyStreakData() {
  console.log('🔍 Verifying streak data...\n');

  const feedsSnapshot = await db.collection('athlete_feed').get();

  for (const feedDoc of feedsSnapshot.docs) {
    const athleteId = feedDoc.id;
    const feedData = feedDoc.data();

    const userDoc = await db.doc(`users/${athleteId}`).get();
    const userName = userDoc.exists ? userDoc.data().displayName : athleteId;

    const completedLessons = feedData.completedLessons || [];
    const completionDates = feedData.completionDates || {};
    const lastActivity = feedData.lastActivity?.toDate?.();

    console.log('='.repeat(60));
    console.log(`Athlete: ${userName}`);
    console.log('='.repeat(60));
    console.log(`Completed Lessons: ${completedLessons.length}`);
    console.log(`Completion Dates Tracked: ${Object.keys(completionDates).length}`);
    console.log(`Last Activity: ${lastActivity || 'None'}`);

    if (Object.keys(completionDates).length > 0) {
      const streak = calculateStreak(completionDates);
      console.log(`\n📊 Calculated Streak: ${streak} days`);

      // Show recent completion dates
      const recentDates = Object.entries(completionDates)
        .map(([lessonId, timestamp]) => ({
          lessonId,
          date: timestamp.toDate().toISOString().split('T')[0]
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

      console.log('\n📅 Recent Completions:');
      recentDates.forEach(({ lessonId, date }) => {
        console.log(`  - ${date}: ${lessonId}`);
      });
    } else {
      console.log('\n⚠️  No completion dates tracked');
    }

    console.log();
  }

  await admin.app().delete();
}

verifyStreakData()
  .then(() => {
    console.log('✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
