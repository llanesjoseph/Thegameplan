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

async function findCoachUsers() {
  console.log('Searching for coach users...\n');

  // Check users collection for role=coach
  const usersSnapshot = await db.collection('users')
    .where('role', '==', 'coach')
    .get();

  console.log(`Found ${usersSnapshot.size} users with role='coach'\n`);

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('Document ID:', doc.id);
    console.log('Display Name:', data.displayName);
    console.log('Email:', data.email);
    console.log('Role:', data.role);
    console.log('Sport:', data.sport);
    console.log('Sports:', data.sports);
    console.log('');
  });

  // Also check public_profiles collection
  console.log('\nChecking public_profiles collection...\n');
  const profilesSnapshot = await db.collection('public_profiles').get();
  console.log(`Found ${profilesSnapshot.size} public profiles\n`);

  profilesSnapshot.forEach(doc => {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('Document ID:', doc.id);
    console.log('Name:', data.name);
    console.log('Display Name:', data.displayName);
    console.log('Role:', data.role);
    console.log('Sport:', data.sport);
    console.log('Sports:', data.sports);
    console.log('Slug:', data.slug);
    console.log('');
  });

  await admin.app().delete();
}

findCoachUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
