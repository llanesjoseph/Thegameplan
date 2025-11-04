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

async function checkCoachSports() {
  console.log('Checking coach sports data...\n');

  // Check Lona Vincent
  const lonaQuery = await db.collection('coaches')
    .where('slug', '==', 'lona-vincent')
    .get();

  if (!lonaQuery.empty) {
    console.log('='.repeat(60));
    console.log('LONA VINCENT');
    console.log('='.repeat(60));
    const lonaDoc = lonaQuery.docs[0];
    const lonaData = lonaDoc.data();
    console.log('Document ID:', lonaDoc.id);
    console.log('Name:', lonaData.name);
    console.log('Sport (singular):', lonaData.sport);
    console.log('Sports (array):', lonaData.sports);
    console.log('\nFull data:', JSON.stringify(lonaData, null, 2));
  } else {
    console.log('Lona Vincent not found!');
  }

  console.log('\n');

  // Check Joseph Gomes
  const josephQuery = await db.collection('coaches')
    .where('slug', '==', 'joseph-gomes')
    .get();

  if (!josephQuery.empty) {
    console.log('='.repeat(60));
    console.log('JOSEPH GOMES');
    console.log('='.repeat(60));
    const josephDoc = josephQuery.docs[0];
    const josephData = josephDoc.data();
    console.log('Document ID:', josephDoc.id);
    console.log('Name:', josephData.name);
    console.log('Sport (singular):', josephData.sport);
    console.log('Sports (array):', josephData.sports);
    console.log('\nFull data:', JSON.stringify(josephData, null, 2));
  } else {
    console.log('Joseph Gomes not found!');
  }

  await admin.app().delete();
}

checkCoachSports()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
