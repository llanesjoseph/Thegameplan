const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function detailedUserReport() {
  console.log('📋 DETAILED USER REPORT - ALL USERS\n');

  const usersSnapshot = await db.collection('users').get();

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`TOTAL USERS: ${usersSnapshot.size}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const users = [];

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    users.push({
      uid: doc.id,
      email: data.email || 'No email',
      displayName: data.displayName || 'No name',
      role: data.role || 'No role',
      invitationRole: data.invitationRole || 'Not set',
      roleUpdateReason: data.roleUpdateReason || 'None',
      roleUpdatedAt: data.roleUpdatedAt?.toDate?.()?.toISOString() || 'Unknown',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || 'Unknown'
    });
  }

  // Sort by most recent roleUpdatedAt
  users.sort((a, b) => {
    if (a.roleUpdatedAt === 'Unknown') return 1;
    if (b.roleUpdatedAt === 'Unknown') return -1;
    return new Date(b.roleUpdatedAt) - new Date(a.roleUpdatedAt);
  });

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Invitation Role: ${user.invitationRole}`);

    // Highlight mismatches
    if (user.invitationRole !== 'Not set' && user.role !== user.invitationRole) {
      console.log(`   ⚠️  MISMATCH: Should be '${user.invitationRole}' but is '${user.role}'`);
    }

    console.log(`   Role Update Reason: ${user.roleUpdateReason}`);
    console.log(`   Role Updated At: ${user.roleUpdatedAt}`);
    console.log(`   Created At: ${user.createdAt}`);

    // Highlight auto-corrections
    if (user.roleUpdateReason.includes('auto-correction')) {
      console.log(`   🚨 AUTO-CORRECTION DETECTED`);
    }

    // Highlight manual fixes
    if (user.roleUpdateReason.includes('Manual fix')) {
      console.log(`   🔧 MANUAL FIX APPLIED`);
    }

    console.log('');
  });

  // Statistics
  const withInvitationRole = users.filter(u => u.invitationRole !== 'Not set');
  const withoutInvitationRole = users.filter(u => u.invitationRole === 'Not set');
  const mismatches = users.filter(u =>
    u.invitationRole !== 'Not set' && u.role !== u.invitationRole
  );
  const autoCorrections = users.filter(u =>
    u.roleUpdateReason.includes('auto-correction')
  );
  const manualFixes = users.filter(u =>
    u.roleUpdateReason.includes('Manual fix')
  );

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 STATISTICS:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`   Total Users: ${users.length}`);
  console.log(`   With Invitation Role: ${withInvitationRole.length}`);
  console.log(`   Without Invitation Role: ${withoutInvitationRole.length}`);
  console.log(`   Current Mismatches: ${mismatches.length}`);
  console.log(`   Users with Auto-Corrections: ${autoCorrections.length}`);
  console.log(`   Users with Manual Fixes: ${manualFixes.length}`);
  console.log('');

  if (autoCorrections.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚨 USERS AFFECTED BY AUTO-CORRECTION:');
    console.log('═══════════════════════════════════════════════════════════\n');
    autoCorrections.forEach(user => {
      console.log(`   ${user.email} (${user.role}) - ${user.roleUpdateReason}`);
    });
    console.log('');
  }

  if (mismatches.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  CURRENT MISMATCHES NEED FIXING:');
    console.log('═══════════════════════════════════════════════════════════\n');
    mismatches.forEach(user => {
      console.log(`   ${user.email}: ${user.role} → should be ${user.invitationRole}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 DEPLOYMENT STATUS:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Cloud Functions needed to prevent future issues:');
  console.log('   - enforceInvitationRole (real-time trigger)');
  console.log('   - dailyRoleConsistencyCheck (scheduled)');
  console.log('   - manualRoleEnforcement (callable)');
  console.log('');
  console.log('Run: firebase deploy --only functions');
  console.log('');

  process.exit(0);
}

detailedUserReport().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
