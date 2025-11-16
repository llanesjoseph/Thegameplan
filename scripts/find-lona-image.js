const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findLonaImage() {
  console.log('=== SEARCHING FOR LONA VINCENT IMAGE ===\n');

  // Search creators_index
  const creatorsSnapshot = await db.collection('creators_index')
    .where('displayName', '==', 'Lona Vincent')
    .get();

  if (!creatorsSnapshot.empty) {
    creatorsSnapshot.forEach(doc => {
      console.log('CREATORS_INDEX DOCUMENT:', doc.id);
      const data = doc.data();
      console.log('All image-related fields:');
      console.log('  profileImageUrl:', data.profileImageUrl);
      console.log('  headshotUrl:', data.headshotUrl);
      console.log('  photoURL:', data.photoURL);
      console.log('  profileImage:', data.profileImage);
      console.log('  bannerUrl:', data.bannerUrl);
      console.log('  heroImageUrl:', data.heroImageUrl);
      console.log('  coverImageUrl:', data.coverImageUrl);
      console.log('  slug:', data.slug);
      console.log('');
    });
  }

  // Search users collection
  const usersSnapshot = await db.collection('users')
    .where('displayName', '==', 'Lona Vincent')
    .get();

  if (!usersSnapshot.empty) {
    usersSnapshot.forEach(doc => {
      console.log('USERS DOCUMENT:', doc.id);
      const data = doc.data();
      console.log('All image-related fields:');
      console.log('  profileImageUrl:', data.profileImageUrl);
      console.log('  photoURL:', data.photoURL);
      console.log('  profileImage:', data.profileImage);
      console.log('  avatarUrl:', data.avatarUrl);
      console.log('  imageUrl:', data.imageUrl);
      console.log('');
    });
  }

  // Also search by partial name
  const allCreators = await db.collection('creators_index').get();
  console.log('SEARCHING ALL CREATORS FOR "LONA" OR "VINCENT":');
  allCreators.forEach(doc => {
    const data = doc.data();
    const name = (data.displayName || '').toLowerCase();
    if (name.includes('lona') || name.includes('vincent')) {
      console.log('\nFound:', data.displayName, '(' + doc.id + ')');
      console.log('  profileImageUrl:', data.profileImageUrl);
      console.log('  headshotUrl:', data.headshotUrl);
      console.log('  photoURL:', data.photoURL);
      console.log('  bannerUrl:', data.bannerUrl);
      console.log('  heroImageUrl:', data.heroImageUrl);
      console.log('  slug:', data.slug);
    }
  });
}

findLonaImage().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
