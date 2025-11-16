const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testLonaAPI() {
  console.log('=== TESTING LONA API LOGIC ===\n');

  const slug = 'lona-vincent-US6fs1';
  const originalId = 'xpXL0YsVg8U12roUXqTK7rUS6fs1'; // From our previous search

  console.log(`Testing for slug: ${slug}`);
  console.log(`Original ID: ${originalId}\n`);

  // Get coach user data
  const userSnap = await db.collection('users').doc(originalId).get();
  const userData = userSnap.data();

  console.log('USER DATA:');
  console.log('  photoURL:', userData?.photoURL);
  console.log('  profileImage:', userData?.profileImage);
  console.log('  displayName:', userData?.displayName);
  console.log('');

  // Get coach profile from creators_index
  const creatorIndexDoc = await db.collection('creators_index').doc(originalId).get();
  const creatorData = creatorIndexDoc.data();

  console.log('CREATOR DATA:');
  console.log('  profileImageUrl:', creatorData?.profileImageUrl);
  console.log('  headshotUrl:', creatorData?.headshotUrl);
  console.log('  photoURL:', creatorData?.photoURL);
  console.log('  profileImage:', creatorData?.profileImage);
  console.log('');

  // Apply the same normalization logic as the API
  // NEW: Prioritize Firebase Storage URLs over external URLs
  const profileImageUrl = creatorData?.headshotUrl ||
                         creatorData?.photoURL ||
                         userData?.photoURL ||
                         creatorData?.profileImageUrl ||
                         userData?.profileImage ||
                         '';

  const coverImageUrl = creatorData?.heroImageUrl ||
                       creatorData?.coverImageUrl ||
                       creatorData?.bannerUrl ||
                       '';

  console.log('NORMALIZED RESULTS (What API should return):');
  console.log('  profileImageUrl:', profileImageUrl);
  console.log('  coverImageUrl:', coverImageUrl);
  console.log('');

  // Test browse coaches API logic
  console.log('=== TESTING BROWSE COACHES API LOGIC ===\n');

  const snapshot = await db.collection('creators_index')
    .where('isActive', '==', true)
    .orderBy('displayName', 'asc')
    .limit(50)
    .get();

  const lonaInBrowse = snapshot.docs.find(doc => doc.id === originalId);
  if (lonaInBrowse) {
    const data = lonaInBrowse.data();
    // NEW: Prioritize Firebase Storage URLs
    const imageUrl = data.headshotUrl ||
                    data.photoURL ||
                    data.profileImageUrl ||
                    data.profileImage ||
                    data.bannerUrl ||
                    data.heroImageUrl ||
                    data.coverImageUrl;

    console.log('FOUND IN BROWSE COACHES:');
    console.log('  displayName:', data.displayName);
    console.log('  profileImageUrl (from data):', data.profileImageUrl);
    console.log('  imageUrl (normalized):', imageUrl);
    console.log('  isActive:', data.isActive);
  } else {
    console.log('NOT FOUND IN BROWSE COACHES QUERY');
    console.log('Checking isActive status...');
    const lonaDoc = await db.collection('creators_index').doc(originalId).get();
    console.log('  isActive:', lonaDoc.data()?.isActive);
  }
}

testLonaAPI().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
