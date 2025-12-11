/**
 * Fix User Database Issues
 *
 * This script will:
 * 1. Diagnose duplicate user records
 * 2. Fix the super admin account
 * 3. Remove duplicate entries
 *
 * Run with: node scripts/fix-user-database-issues.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found');
  console.error('Please ensure serviceAccountKey.json exists in the project root');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function diagnoseUsers() {
  console.log('\n🔍 DIAGNOSING USER DATABASE\n' + '='.repeat(60));

  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`\n📊 Total users in Firestore: ${usersSnapshot.size}`);

    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();

      // Handle different date formats
      let createdAt = 'NO DATE';
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        } else {
          createdAt = String(data.createdAt);
        }
      }

      users.push({
        uid: doc.id,
        email: data.email || 'NO EMAIL',
        displayName: data.displayName || 'NO NAME',
        role: data.role || 'NO ROLE',
        createdAt: createdAt
      });
    });

    // Display all users
    console.log('\n📋 ALL USERS:');
    console.log('='.repeat(60));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Find duplicates by email
    const emailMap = {};
    users.forEach(user => {
      if (!emailMap[user.email]) {
        emailMap[user.email] = [];
      }
      emailMap[user.email].push(user);
    });

    const duplicates = Object.entries(emailMap).filter(([email, userList]) => userList.length > 1);

    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE EMAILS FOUND:');
      console.log('='.repeat(60));
      duplicates.forEach(([email, userList]) => {
        console.log(`\nEmail: ${email} (${userList.length} entries)`);
        userList.forEach((user, index) => {
          console.log(`  ${index + 1}. UID: ${user.uid}`);
          console.log(`     Name: ${user.displayName}`);
          console.log(`     Role: ${user.role}`);
          console.log(`     Created: ${user.createdAt}`);
        });
      });
    }

    // Find Joseph's accounts
    const josephEmails = ['joseph@crucibleanalytics.dev', 'llanes.joseph.m@gmail.com'];
    const josephAccounts = users.filter(u => josephEmails.includes(u.email.toLowerCase()));

    console.log('\n👤 JOSEPH\'S ACCOUNTS:');
    console.log('='.repeat(60));
    if (josephAccounts.length === 0) {
      console.log('❌ No accounts found for Joseph');
    } else {
      josephAccounts.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Check super admins
    const superAdmins = users.filter(u => u.role === 'superadmin');
    console.log('\n👑 SUPER ADMINS:');
    console.log('='.repeat(60));
    if (superAdmins.length === 0) {
      console.log('❌ No super admins found!');
    } else {
      superAdmins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   UID: ${user.uid}`);
        console.log('');
      });
    }

    return { users, duplicates, josephAccounts, superAdmins };

  } catch (error) {
    console.error('❌ Error diagnosing users:', error);
    throw error;
  }
}

async function getAuthUserByEmail(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

async function fixUserIssues() {
  console.log('\n🔧 FIXING USER DATABASE ISSUES\n' + '='.repeat(60));

  const { users, duplicates, josephAccounts, superAdmins } = await diagnoseUsers();

  // Get Firebase Auth user for joseph@crucibleanalytics.dev
  console.log('\n🔍 Checking Firebase Auth for joseph@crucibleanalytics.dev...');
  const josephAuthUser = await getAuthUserByEmail('joseph@crucibleanalytics.dev');

  if (!josephAuthUser) {
    console.log('❌ No Firebase Auth user found for joseph@crucibleanalytics.dev');
    console.log('   This user needs to sign in at least once to create an Auth record.');
    console.log('   Please have Joseph sign in with this email first.');
    return;
  }

  console.log(`✅ Found Firebase Auth user: ${josephAuthUser.uid}`);
  console.log(`   Email: ${josephAuthUser.email}`);
  console.log(`   Display Name: ${josephAuthUser.displayName || 'Not set'}`);

  // Check if this UID exists in Firestore
  const josephFirestoreDoc = await db.collection('users').doc(josephAuthUser.uid).get();

  if (josephFirestoreDoc.exists) {
    console.log('\n✅ Firestore document exists for joseph@crucibleanalytics.dev');
    const data = josephFirestoreDoc.data();
    console.log(`   Current role: ${data.role || 'NOT SET'}`);
    console.log(`   Current email: ${data.email || 'NOT SET'}`);

    if (data.role !== 'superadmin') {
      console.log('\n🔧 Updating role to superadmin...');
      await db.collection('users').doc(josephAuthUser.uid).update({
        role: 'superadmin',
        email: 'joseph@crucibleanalytics.dev',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Role updated to superadmin');
    } else {
      console.log('✅ Role is already superadmin');
    }
  } else {
    console.log('\n⚠️  Firestore document does NOT exist for joseph@crucibleanalytics.dev');
    console.log('🔧 Creating Firestore document...');
    await db.collection('users').doc(josephAuthUser.uid).set({
      uid: josephAuthUser.uid,
      email: 'joseph@crucibleanalytics.dev',
      displayName: josephAuthUser.displayName || 'Joseph Llanes',
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Firestore document created with superadmin role');
  }

  // Handle duplicates for llanes.joseph.m@gmail.com
  const llanesAccounts = users.filter(u => u.email.toLowerCase() === 'llanes.joseph.m@gmail.com');

  if (llanesAccounts.length > 1) {
    console.log(`\n⚠️  Found ${llanesAccounts.length} duplicate entries for llanes.joseph.m@gmail.com`);
    console.log('🔧 Keeping the oldest entry and removing duplicates...');

    // Sort by creation date, keep oldest
    llanesAccounts.sort((a, b) => {
      if (a.createdAt === 'NO DATE') return 1;
      if (b.createdAt === 'NO DATE') return -1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const toKeep = llanesAccounts[0];
    const toDelete = llanesAccounts.slice(1);

    console.log(`\n   Keeping: UID ${toKeep.uid} (Created: ${toKeep.createdAt})`);
    console.log(`   Deleting: ${toDelete.length} duplicate(s)`);

    for (const user of toDelete) {
      console.log(`   - Deleting UID: ${user.uid}`);
      await db.collection('users').doc(user.uid).delete();
      console.log(`     ✅ Deleted`);
    }

    console.log('\n✅ Duplicates removed');
  } else if (llanesAccounts.length === 1) {
    console.log('\n✅ No duplicates found for llanes.joseph.m@gmail.com');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ USER DATABASE FIX COMPLETE');
  console.log('='.repeat(60));

  // Run diagnosis again to show final state
  console.log('\n📊 FINAL STATE:');
  await diagnoseUsers();
}

// Main execution
(async () => {
  try {
    await fixUserIssues();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
})();
