// Script to delete unwanted coach profiles
// Usage: node scripts/delete-coaches.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Coaches to delete (marked in RED/PINK)
const COACHES_TO_DELETE = [
  {
    id: 'jasmine-aikey-coach',
    name: 'Jasmine Aikey',
    reason: 'Marked for deletion - not needed'
  },
  {
    id: 'HFstEWRA82aqNNuFrqWztIHy1Su1',
    name: 'Lona Vincent (NOT SPECIFIED)',
    reason: 'Duplicate profile - keeping SOCCER version only'
  }
];

async function deleteCoachProfile(coachId, coachName, reason) {
  console.log(`\n🗑️  Deleting: ${coachName} (${coachId})`);
  console.log(`   Reason: ${reason}`);

  try {
    // 1. Remove from creators_index
    console.log('   📋 Removing from creators_index...');
    const creatorIndexRef = db.collection('creators_index').doc(coachId);
    if ((await creatorIndexRef.get()).exists) {
      await creatorIndexRef.delete();
      console.log('   ✅ Removed from creators_index');
    } else {
      console.log('   ⚠️  Not found in creators_index');
    }

    // 2. Remove from creator_profiles
    console.log('   📋 Removing from creator_profiles...');
    const creatorProfileRef = db.collection('creator_profiles').doc(coachId);
    if ((await creatorProfileRef.get()).exists) {
      await creatorProfileRef.delete();
      console.log('   ✅ Removed from creator_profiles');
    } else {
      console.log('   ⚠️  Not found in creator_profiles');
    }

    // 3. Remove from coach_profiles
    console.log('   📋 Removing from coach_profiles...');
    const coachProfileRef = db.collection('coach_profiles').doc(coachId);
    if ((await coachProfileRef.get()).exists) {
      await coachProfileRef.delete();
      console.log('   ✅ Removed from coach_profiles');
    } else {
      console.log('   ⚠️  Not found in coach_profiles');
    }

    // 4. Remove slug mapping if it exists
    console.log('   📋 Checking for slug mappings...');
    const slugMappingsSnap = await db.collection('slug_mappings')
      .where('originalId', '==', coachId)
      .get();

    if (!slugMappingsSnap.empty) {
      for (const doc of slugMappingsSnap.docs) {
        await doc.ref.delete();
        console.log(`   ✅ Removed slug mapping: ${doc.id}`);
      }
    } else {
      console.log('   ⚠️  No slug mappings found');
    }

    // 5. Update user document to inactive (don't delete - preserve data)
    console.log('   📋 Deactivating user account...');
    const userRef = db.collection('users').doc(coachId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        role: 'user',
        isActive: false,
        deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deactivatedReason: reason
      });
      console.log('   ✅ User account deactivated');
    } else {
      console.log('   ⚠️  User document not found');
    }

    console.log(`   ✅ ${coachName} completely removed from platform`);

  } catch (error) {
    console.error(`   ❌ Error deleting ${coachName}:`, error);
    throw error;
  }
}

async function deleteAllCoaches() {
  console.log('🗑️  Starting deletion of unwanted coach profiles\n');
  console.log('═'.repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (const coach of COACHES_TO_DELETE) {
    try {
      await deleteCoachProfile(coach.id, coach.name, coach.reason);
      successCount++;
    } catch (error) {
      console.error(`Failed to delete ${coach.name}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Deletion Summary:');
  console.log(`   ✅ Successfully deleted: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log('\nRemaining coaches on platform:');
  console.log('   ✅ Joseph Llanes (SOCCER)');
  console.log('   ✅ Lona Vincent (Coach) (SOCCER)');
}

// Run the script
deleteAllCoaches()
  .then(() => {
    console.log('\n✅ All deletions completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deletion failed:', error);
    process.exit(1);
  });
