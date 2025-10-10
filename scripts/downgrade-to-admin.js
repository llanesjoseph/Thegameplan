/**
 * Downgrade Lona and Merline from superadmin to admin
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function downgradeToAdmin() {
  console.log('\n🔧 DOWNGRADING USERS TO ADMIN ROLE\n' + '='.repeat(60));

  const usersToDowngrade = [
    {
      email: 'lonaloraine.vincent@gmail.com',
      name: 'Lona Vincent'
    },
    {
      email: 'merlinesaintil@gmail.com',
      name: 'Merline Saintil'
    }
  ];

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();

    for (const userData of usersToDowngrade) {
      console.log(`\n🔍 Processing: ${userData.name} (${userData.email})`);

      // Find user by email
      let userDoc = null;
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase() === userData.email.toLowerCase()) {
          userDoc = { id: doc.id, data: data };
        }
      });

      if (!userDoc) {
        console.log(`⚠️  User not found: ${userData.email}`);
        continue;
      }

      console.log(`   UID: ${userDoc.id}`);
      console.log(`   Current Role: ${userDoc.data.role}`);

      if (userDoc.data.role === 'superadmin') {
        // Update to admin
        await db.collection('users').doc(userDoc.id).update({
          role: 'admin',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          roleUpdatedReason: 'Downgraded from superadmin to admin - will use invitation system instead'
        });

        console.log(`   ✅ Updated to: admin`);
      } else if (userDoc.data.role === 'admin') {
        console.log(`   ℹ️  Already admin - no change needed`);
      } else {
        console.log(`   ⚠️  Unexpected role: ${userDoc.data.role} - updating to admin anyway`);
        await db.collection('users').doc(userDoc.id).update({
          role: 'admin',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Updated to: admin`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DOWNGRADE COMPLETE');
    console.log('='.repeat(60));
    console.log('\nBoth users are now admins instead of superadmins.');
    console.log('Only joseph@crucibleanalytics.dev remains as superadmin.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the downgrade
(async () => {
  try {
    await downgradeToAdmin();
    process.exit(0);
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
})();
