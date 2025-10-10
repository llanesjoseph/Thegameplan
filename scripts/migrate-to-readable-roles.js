/**
 * Database Role Migration Script
 *
 * CHANGES:
 * - 'user' → 'athlete' (human-readable athlete role)
 * - 'creator' → 'coach' (human-readable coach role)
 * - 'assistant_coach', 'admin', 'superadmin' remain unchanged
 *
 * This eliminates the need for mapping functions and makes the database self-documenting.
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

async function migrateRolesToReadableNames() {
  console.log('\n🚀 DATABASE ROLE MIGRATION\n' + '='.repeat(70));
  console.log('Converting to human-readable role names:');
  console.log('  • user → athlete');
  console.log('  • creator → coach');
  console.log('  • assistant_coach, admin, superadmin (no change)');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Analyze current database state
    console.log('📊 Step 1: Analyzing current database...\n');

    const allUsersSnapshot = await db.collection('users').get();
    const roleStats = {};
    const usersToMigrate = [];

    allUsersSnapshot.forEach(doc => {
      const data = doc.data();
      const role = data.role || 'NO_ROLE';

      roleStats[role] = (roleStats[role] || 0) + 1;

      // Identify users that need migration
      if (role === 'user' || role === 'creator') {
        usersToMigrate.push({
          id: doc.id,
          email: data.email,
          currentRole: role,
          newRole: role === 'user' ? 'athlete' : 'coach'
        });
      }
    });

    console.log('Current Role Distribution:');
    Object.keys(roleStats).sort().forEach(role => {
      const emoji = role === 'user' ? '👤' : role === 'creator' ? '👨‍🏫' : '✨';
      console.log(`  ${emoji} ${role}: ${roleStats[role]} user(s)`);
    });

    console.log(`\n🔄 Users requiring migration: ${usersToMigrate.length}`);

    if (usersToMigrate.length === 0) {
      console.log('\n✅ No migration needed! All roles are already using readable names.');
      return;
    }

    // Step 2: Show migration plan
    console.log('\n📋 Migration Plan:\n');
    usersToMigrate.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`);
      console.log(`     ${user.currentRole} → ${user.newRole}`);
    });

    // Step 3: Execute migration
    console.log('\n🔧 Step 2: Executing migration...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        await db.collection('users').doc(user.id).update({
          role: user.newRole,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`  ✅ ${user.email}: ${user.currentRole} → ${user.newRole}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ ${user.email}: Failed - ${error.message}`);
        errorCount++;
      }
    }

    // Step 4: Verify migration
    console.log('\n🔍 Step 3: Verifying migration...\n');

    const verifySnapshot = await db.collection('users').get();
    const newRoleStats = {};

    verifySnapshot.forEach(doc => {
      const role = doc.data().role || 'NO_ROLE';
      newRoleStats[role] = (newRoleStats[role] || 0) + 1;
    });

    console.log('New Role Distribution:');
    Object.keys(newRoleStats).sort().forEach(role => {
      const emoji = role === 'athlete' ? '🏃' :
                    role === 'coach' ? '👨‍🏫' :
                    role === 'admin' ? '👑' :
                    role === 'superadmin' ? '⭐' : '✨';
      console.log(`  ${emoji} ${role}: ${newRoleStats[role]} user(s)`);
    });

    // Check for any remaining old role names
    const remainingOldRoles = (newRoleStats['user'] || 0) + (newRoleStats['creator'] || 0);

    console.log('\n' + '='.repeat(70));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully migrated: ${successCount} user(s)`);
    if (errorCount > 0) {
      console.log(`❌ Failed migrations: ${errorCount} user(s)`);
    }
    if (remainingOldRoles > 0) {
      console.log(`⚠️  WARNING: ${remainingOldRoles} user(s) still have old role names`);
    } else {
      console.log('🎉 All users now use readable role names!');
    }
    console.log('='.repeat(70));

    console.log('\n📝 NEXT STEPS:');
    console.log('  1. Update firestore.rules to validate new role names');
    console.log('  2. Update routing logic in app/dashboard/page.tsx');
    console.log('  3. Remove getRoleLabel() mapping functions');
    console.log('  4. Update role management dropdowns');
    console.log('  5. Test all role-based features');
    console.log('  6. Deploy updated Firestore rules: firebase deploy --only firestore:rules');
    console.log('  7. Deploy application to Vercel\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    throw error;
  }
}

// Run the migration
migrateRolesToReadableNames()
  .then(() => {
    console.log('✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
