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

async function fixCoachSports() {
  console.log('Fixing coach sports across all collections...\n');

  const fixes = [
    {
      uid: 'xpXL0YsVg8U12roUXqTK7rUS6fs1',
      name: 'Lona Vincent',
      correctSport: 'Basketball'
    },
    {
      uid: 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2',
      name: 'Joseph Llanes',
      correctSport: 'BJJ'
    }
  ];

  for (const fix of fixes) {
    console.log('='.repeat(60));
    console.log(`Fixing ${fix.name} (${fix.uid})`);
    console.log(`Setting sport to: ${fix.correctSport}`);
    console.log('='.repeat(60));

    // 1. Check users collection (should already be correct)
    const userDoc = await db.collection('users').doc(fix.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`✓ users collection - current sport: ${userData.sport}`);
      if (userData.sport !== fix.correctSport) {
        await db.collection('users').doc(fix.uid).update({
          sport: fix.correctSport,
          updatedAt: new Date()
        });
        console.log(`  ✅ Updated users collection`);
      }
    }

    // 2. Update creatorPublic collection
    const creatorPublicDoc = await db.collection('creatorPublic').doc(fix.uid).get();
    if (creatorPublicDoc.exists) {
      const data = creatorPublicDoc.data();
      console.log(`✓ creatorPublic collection - current sport: ${data.sport}`);
      // Store in lowercase as per the sync logic
      await db.collection('creatorPublic').doc(fix.uid).update({
        sport: fix.correctSport.toLowerCase(),
        updatedAt: new Date()
      });
      console.log(`  ✅ Updated creatorPublic collection to: ${fix.correctSport.toLowerCase()}`);
    } else {
      console.log(`  ⚠️  No document in creatorPublic`);
    }

    // 3. Update creators_index collection
    const creatorsIndexDoc = await db.collection('creators_index').doc(fix.uid).get();
    if (creatorsIndexDoc.exists) {
      const data = creatorsIndexDoc.data();
      console.log(`✓ creators_index collection - current sport: ${data.sport}`);
      await db.collection('creators_index').doc(fix.uid).update({
        sport: fix.correctSport,
        updatedAt: new Date()
      });
      console.log(`  ✅ Updated creators_index collection to: ${fix.correctSport}`);
    } else {
      console.log(`  ⚠️  No document in creators_index`);
    }

    console.log();
  }

  console.log('\n✅ All fixes complete!');

  await admin.app().delete();
}

fixCoachSports()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
