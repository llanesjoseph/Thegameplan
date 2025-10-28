// Script to fully restore Lona Vincent's coach profile from backup
// Usage: node scripts/restore-lona-from-backup.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const COACH_ID = 'HFstEWRA82aqNNuFrqWztIHy1Su1';

// Original backup data for Lona Vincent
const BACKUP_DATA = {
  "id": "HFstEWRA82aqNNuFrqWztIHy1Su1",
  "email": "lona@aikeysaintil.com",
  "onboardedAt": "2025-10-13T19:53:58.000Z",
  "invitationCode": "admin-1760384984260-ml62p9lzear",
  "invitedBy": "lbC6UOZtC5ODlpxqqcrQmOGbwML2",
  "createdAt": "2025-10-13T19:53:58.000Z",
  "manuallySetRole": true,
  "roleProtected": true,
  "roleSource": "admin_invitation",
  "invitationRole": "admin",
  "profileComplete": false,
  "preferences": {
    "sports": [],
    "notifications": {
      "updates": true,
      "email": true,
      "push": true,
      "lessons": true
    }
  },
  "displayName": "Lona Vincent",
  "uid": "HFstEWRA82aqNNuFrqWztIHy1Su1",
  "lastLoginAt": null,
  "stats": {
    "lessonsCompleted": 0,
    "lessonsCreated": 0,
    "loginCount": 1
  },
  "needsOnboarding": false,
  "onboardingCompleted": false,
  "signUpTimestamp": null,
  "roleUpdateReason": "Enforced from invitation",
  "roleUpdatedAt": "2025-10-13T20:38:59.000Z",
  "role": "coach",
  "updatedAt": "2025-10-23T21:59:12.000Z"
};

async function restoreLonaProfile() {
  console.log(`🔄 Starting full restoration of Lona Vincent's coach profile from backup\n`);

  try {
    // 1. Restore user document from backup
    console.log('📋 Restoring user document from backup...');

    // Convert date strings to Timestamps
    const restoreData = {
      ...BACKUP_DATA,
      onboardedAt: admin.firestore.Timestamp.fromDate(new Date(BACKUP_DATA.onboardedAt)),
      createdAt: admin.firestore.Timestamp.fromDate(new Date(BACKUP_DATA.createdAt)),
      roleUpdatedAt: admin.firestore.Timestamp.fromDate(new Date(BACKUP_DATA.roleUpdatedAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(BACKUP_DATA.updatedAt)),
      // Remove fields that were added during removal
      isActive: true,
      restoredAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Remove the deactivation fields if they exist
    delete restoreData.deactivatedAt;
    delete restoreData.deactivatedReason;

    await db.collection('users').doc(COACH_ID).set(restoreData, { merge: true });
    console.log('✅ User document restored from backup');

    // 2. Restore to creators_index
    console.log('\n📋 Restoring to creators_index...');
    await db.collection('creators_index').doc(COACH_ID).set({
      uid: COACH_ID,
      email: BACKUP_DATA.email,
      displayName: BACKUP_DATA.displayName,
      slug: COACH_ID,
      sport: 'Not specified',
      specialties: [],
      isActive: true,
      featured: false,
      verified: false,
      experience: 'intermediate',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(BACKUP_DATA.createdAt)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ Restored to creators_index');

    console.log('\n✅ Lona Vincent profile has been fully restored from backup!');
    console.log('\nRestored data:');
    console.log(`  - Email: ${BACKUP_DATA.email}`);
    console.log(`  - Display Name: ${BACKUP_DATA.displayName}`);
    console.log(`  - Role: ${BACKUP_DATA.role}`);
    console.log(`  - Role Source: ${BACKUP_DATA.roleSource}`);
    console.log(`  - Invitation Code: ${BACKUP_DATA.invitationCode}`);

    console.log('\nThe profile is now accessible at:');
    console.log(`  - https://playbookd.crucibleanalytics.dev/coach-profile/${COACH_ID}`);

  } catch (error) {
    console.error('\n❌ Error restoring profile:', error);
    throw error;
  }
}

// Run the script
restoreLonaProfile()
  .then(() => {
    console.log('\n✅ Full restoration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Restoration failed:', error);
    process.exit(1);
  });
