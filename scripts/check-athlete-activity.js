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

async function checkAthleteActivity() {
  console.log('Finding athletes...\n');

  // First, find all athletes
  const usersSnapshot = await db.collection('users')
    .where('role', '==', 'athlete')
    .get();

  console.log(`Found ${usersSnapshot.size} athletes:\n`);

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    console.log('='.repeat(60));
    console.log(`Athlete: ${userData.displayName} (${userDoc.id})`);
    console.log('='.repeat(60));

    // Check their athlete_feed
    const feedDoc = await db.doc(`athlete_feed/${userDoc.id}`).get();

    if (feedDoc.exists) {
      const data = feedDoc.data();
      console.log('Athlete Feed Data:');
      console.log('- Completed Lessons:', data.completedLessons?.length || 0);
      console.log('- Total Lessons:', data.totalLessons || 0);
      console.log('- Last Activity:', data.lastActivity?.toDate?.() || 'No timestamp');
      console.log('- Updated At:', data.updatedAt?.toDate?.() || 'No timestamp');
    } else {
      console.log('No athlete_feed document found');
    }
    console.log();
  }

  await admin.app().delete();
}

checkAthleteActivity()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
