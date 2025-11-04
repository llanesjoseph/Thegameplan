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

async function listAllCoaches() {
  console.log('Fetching all coaches...\n');

  const coachesSnapshot = await db.collection('coaches').get();

  console.log(`Total coaches: ${coachesSnapshot.size}\n`);

  coachesSnapshot.forEach(doc => {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('Document ID:', doc.id);
    console.log('Name:', data.name);
    console.log('Slug:', data.slug);
    console.log('Sport (singular):', data.sport);
    console.log('Sports (array):', data.sports);
    console.log('');
  });

  await admin.app().delete();
}

listAllCoaches()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
