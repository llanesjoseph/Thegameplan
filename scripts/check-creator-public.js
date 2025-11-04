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

async function checkCreatorPublic() {
  console.log('Checking creatorPublic collection...\n');

  const snapshot = await db.collection('creatorPublic').get();
  console.log(`Found ${snapshot.size} documents in creatorPublic\n`);

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('Document ID:', doc.id);
    console.log('Name:', data.name);
    console.log('Display Name:', data.displayName);
    console.log('Sport:', data.sport);
    console.log('Verified:', data.verified);
    console.log('Featured:', data.featured);
    console.log('');
  });

  // Also check creators_index
  console.log('\nChecking creators_index collection...\n');
  const indexSnapshot = await db.collection('creators_index').get();
  console.log(`Found ${indexSnapshot.size} documents in creators_index\n`);

  indexSnapshot.forEach(doc => {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('Document ID:', doc.id);
    console.log('Display Name:', data.displayName);
    console.log('Sport:', data.sport);
    console.log('Verified:', data.verified);
    console.log('Featured:', data.featured);
    console.log('');
  });

  await admin.app().delete();
}

checkCreatorPublic()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
