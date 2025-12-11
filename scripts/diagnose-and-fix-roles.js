/**
 * Diagnose and Fix Role Issues
 *
 * Issues:
 * 1. llanes.joseph.m@gmail.com shows as "Athlete" but should be "Coach"
 * 2. joseph@crucibleanalytics.dev not showing up in role management
 *
 * The role management page recognizes:
 * - 'superadmin' → Super Admin
 * - 'creator' → Coach
 * - 'assistant_coach' → Assistant Coach
 * - 'user' → Athlete
 *
 * But Firestore might have roles like 'athlete' or 'coach' which map incorrectly
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function diagnoseAndFixRoles() {
  console.log('\n🔍 DIAGNOSING ROLE ISSUES\n' + '='.repeat(70));

  try {
    // Step 1: Check llanes.joseph.m@gmail.com
    console.log('\n📋 Step 1: Checking llanes.joseph.m@gmail.com...');
    const llamnesQuery = await db.collection('users')
      .where('email', '==', 'llanes.joseph.m@gmail.com')
      .get();

    if (llamnesQuery.empty) {
      console.log('❌ llanes.joseph.m@gmail.com NOT FOUND in Firestore');
    } else {
      llamnesQuery.forEach(doc => {
        const data = doc.data();
        console.log(`✅ Found: ${doc.id}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Role: ${data.role}`);
        console.log(`   Display Name: ${data.displayName || 'N/A'}`);

        if (data.role !== 'creator') {
          console.log(`   ⚠️  ISSUE: Role is '${data.role}' but should be 'creator' (for Coach)`);
        }
      });
    }

    // Step 2: Check joseph@crucibleanalytics.dev
    console.log('\n📋 Step 2: Checking joseph@crucibleanalytics.dev...');
    const josephQuery = await db.collection('users')
      .where('email', '==', 'joseph@crucibleanalytics.dev')
      .get();

    if (josephQuery.empty) {
      console.log('❌ joseph@crucibleanalytics.dev NOT FOUND in Firestore');
      console.log('   This user has never logged in or been created');
    } else {
      josephQuery.forEach(doc => {
        const data = doc.data();
        console.log(`✅ Found: ${doc.id}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Role: ${data.role}`);
        console.log(`   Display Name: ${data.displayName || 'N/A'}`);

        if (data.role !== 'superadmin') {
          console.log(`   ⚠️  ISSUE: Role is '${data.role}' but should be 'superadmin'`);
        }
      });
    }

    // Step 3: Check all users with non-standard roles
    console.log('\n📋 Step 3: Checking for non-standard roles...');
    const allUsersQuery = await db.collection('users').get();
    const roleMap = {};
    const nonStandardRoles = [];

    allUsersQuery.forEach(doc => {
      const data = doc.data();
      const role = data.role || 'NO_ROLE';

      roleMap[role] = (roleMap[role] || 0) + 1;

      // Standard roles for role management page
      const standardRoles = ['superadmin', 'creator', 'assistant_coach', 'user'];
      if (!standardRoles.includes(role)) {
        nonStandardRoles.push({
          id: doc.id,
          email: data.email,
          role: role,
          displayName: data.displayName
        });
      }
    });

    console.log('\n📊 Role Distribution:');
    Object.keys(roleMap).sort().forEach(role => {
      console.log(`   ${role}: ${roleMap[role]}`);
    });

    if (nonStandardRoles.length > 0) {
      console.log(`\n⚠️  Found ${nonStandardRoles.length} user(s) with non-standard roles:`);
      nonStandardRoles.forEach(user => {
        console.log(`   - ${user.email} (${user.id}): role='${user.role}'`);
      });
    }

    // Step 4: Fix the issues
    console.log('\n\n🔧 FIXING ROLES\n' + '='.repeat(70));

    // Fix llanes.joseph.m@gmail.com
    if (!llamnesQuery.empty) {
      const doc = llamnesQuery.docs[0];
      const data = doc.data();

      if (data.role !== 'creator') {
        console.log(`\n✏️  Fixing llanes.joseph.m@gmail.com...`);
        await db.collection('users').doc(doc.id).update({
          role: 'creator',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Updated role from '${data.role}' to 'creator'`);
      } else {
        console.log(`\n✅ llanes.joseph.m@gmail.com already has correct role: 'creator'`);
      }
    }

    // joseph@crucibleanalytics.dev should auto-provision on first login
    // If not found, that's expected - they haven't logged in yet
    if (josephQuery.empty) {
      console.log(`\n📝 joseph@crucibleanalytics.dev: Will auto-provision to 'superadmin' on first login`);
    }

    // Fix non-standard roles
    if (nonStandardRoles.length > 0) {
      console.log(`\n✏️  Fixing non-standard roles...`);

      for (const user of nonStandardRoles) {
        let newRole = 'user'; // Default to athlete

        // Map non-standard roles to standard ones
        if (user.role === 'athlete') {
          newRole = 'user';
        } else if (user.role === 'coach') {
          newRole = 'creator';
        } else if (user.role === 'admin') {
          newRole = 'creator'; // Admins become creators unless superadmin
        }

        console.log(`   ${user.email}: '${user.role}' → '${newRole}'`);

        await db.collection('users').doc(user.id).update({
          role: newRole,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log(`✅ Fixed ${nonStandardRoles.length} non-standard role(s)`);
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('✅ DIAGNOSIS AND FIX COMPLETE');
    console.log('='.repeat(70));
    console.log('\nRefresh the role management page to see the changes.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
diagnoseAndFixRoles()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
