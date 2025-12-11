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

async function checkMerlineProfile() {
  const merlineUid = 'ybEMp63hNxTjvGdNxKSuIKdLxct2';

  console.log('Checking Merline profile data across all collections...\n');
  console.log('UID:', merlineUid);
  console.log('='.repeat(60));

  // 1. Check users collection
  console.log('\n1. USERS COLLECTION:');
  const userDoc = await db.collection('users').doc(merlineUid).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('✓ Document exists');
    console.log('Display Name:', data.displayName);
    console.log('Email:', data.email);
    console.log('Role:', data.role);
    console.log('Sport:', data.sport);
    console.log('Photo URL:', data.photoURL);
  } else {
    console.log('❌ No document found');
  }

  // 2. Check creatorPublic collection
  console.log('\n2. CREATOR PUBLIC COLLECTION:');
  const publicDoc = await db.collection('creatorPublic').doc(merlineUid).get();
  if (publicDoc.exists) {
    const data = publicDoc.data();
    console.log('✓ Document exists');
    console.log('Name:', data.name);
    console.log('Sport:', data.sport);
    console.log('Verified:', data.verified);
    console.log('Featured:', data.featured);
    console.log('Tagline:', data.tagline);
    console.log('Lesson Count:', data.lessonCount);
  } else {
    console.log('❌ No document found');
  }

  // 3. Check creators_index collection (THIS IS WHAT THE PROFILE PAGE USES)
  console.log('\n3. CREATORS_INDEX COLLECTION (Used by profile page):');
  const indexDoc = await db.collection('creators_index').doc(merlineUid).get();
  if (indexDoc.exists) {
    const data = indexDoc.data();
    console.log('✓ Document exists');
    console.log('Full data:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ No document found - THIS IS THE PROBLEM!');
  }

  // 4. Check slug_mappings collection
  console.log('\n4. SLUG MAPPINGS:');
  const slugQuery = await db.collection('slug_mappings')
    .where('originalId', '==', merlineUid)
    .get();

  if (!slugQuery.empty) {
    slugQuery.forEach(doc => {
      const data = doc.data();
      console.log('✓ Slug mapping exists');
      console.log('Slug:', doc.id);
      console.log('Original ID:', data.originalId);
      console.log('Type:', data.type);
    });
  } else {
    console.log('❌ No slug mapping found');
  }

  // 5. Check coach_profiles collection
  console.log('\n5. COACH_PROFILES COLLECTION:');
  const coachProfileDoc = await db.collection('coach_profiles').doc(merlineUid).get();
  if (coachProfileDoc.exists) {
    const data = coachProfileDoc.data();
    console.log('✓ Document exists');
    console.log('Full data:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ No document found');
  }

  await admin.app().delete();
}

checkMerlineProfile()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
