const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function diagnoseAllUsers() {
  console.log('🔍 SCANNING ALL USERS FOR ROLE MISMATCHES...\n');

  const usersSnapshot = await db.collection('users').get();

  const mismatches = [];
  const correctUsers = [];
  const noInvitationRole = [];

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const uid = doc.id;
    const email = data.email || 'No email';
    const currentRole = data.role;
    const invitationRole = data.invitationRole;
    const roleUpdateReason = data.roleUpdateReason || 'None';

    if (invitationRole) {
      if (currentRole !== invitationRole) {
        // MISMATCH FOUND
        mismatches.push({
          uid,
          email,
          currentRole,
          invitationRole,
          roleUpdateReason,
          displayName: data.displayName || 'Unknown'
        });
      } else {
        // Correct role
        correctUsers.push({
          uid,
          email,
          role: currentRole,
          roleUpdateReason
        });
      }
    } else {
      // No invitation role set
      noInvitationRole.push({
        uid,
        email,
        role: currentRole,
        roleUpdateReason
      });
    }
  }

  // REPORT RESULTS
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚨 CRITICAL USERS WITH ROLE MISMATCHES:');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (mismatches.length > 0) {
    mismatches.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.displayName})`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   ❌ Current Role: ${user.currentRole}`);
      console.log(`   ✅ Should Be: ${user.invitationRole}`);
      console.log(`   📝 Reason: ${user.roleUpdateReason}`);
      console.log('');
    });
    console.log(`\n🚨 TOTAL AFFECTED: ${mismatches.length} users\n`);
  } else {
    console.log('✅ No mismatches found!\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ USERS WITH CORRECT ROLES:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total: ${correctUsers.length} users\n`);

  // Show known coach auto-correction users
  const autoCorrections = correctUsers.filter(u =>
    u.roleUpdateReason && u.roleUpdateReason.includes('auto-correction')
  );

  if (autoCorrections.length > 0) {
    console.log('⚠️  Users with "auto-correction" in reason (may have been affected):');
    autoCorrections.forEach(user => {
      console.log(`   - ${user.email}: ${user.role} (${user.roleUpdateReason})`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 USERS WITHOUT INVITATION ROLE:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total: ${noInvitationRole.length} users\n`);

  // Summary Statistics
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`   Total Users: ${usersSnapshot.size}`);
  console.log(`   🚨 Mismatches: ${mismatches.length}`);
  console.log(`   ✅ Correct: ${correctUsers.length}`);
  console.log(`   📋 No Invitation Role: ${noInvitationRole.length}`);
  console.log(`   ⚠️  Auto-corrections: ${autoCorrections.length}`);
  console.log('');

  if (mismatches.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 NEXT STEPS:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('1. Run: firebase login --reauth');
    console.log('2. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('3. Deploy Cloud Functions:');
    console.log('   firebase deploy --only functions:enforceInvitationRole,functions:dailyRoleConsistencyCheck,functions:manualRoleEnforcement');
    console.log('');
    console.log('⚡ Once deployed, ALL mismatches will be auto-fixed within SECONDS.');
    console.log('');
  }

  process.exit(0);
}

diagnoseAllUsers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
