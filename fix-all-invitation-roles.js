const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAllInvitationRoles() {
  try {
    console.log('\n🔍 Scanning all users for role mismatches...\n');
    
    const usersSnapshot = await db.collection('users').get();
    let fixedCount = 0;
    let skippedCount = 0;
    const fixes = [];
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const currentRole = data.role;
      const invitationRole = data.invitationRole;
      
      // If invitationRole exists and doesn't match current role, fix it
      if (invitationRole && currentRole !== invitationRole) {
        console.log(`❌ MISMATCH FOUND:`);
        console.log(`   User: ${data.email || doc.id}`);
        console.log(`   Current role: ${currentRole}`);
        console.log(`   Should be: ${invitationRole}`);
        
        await db.collection('users').doc(doc.id).update({
          role: invitationRole,
          roleUpdatedAt: admin.firestore.Timestamp.now(),
          roleUpdateReason: 'Batch fix - enforced from invitationRole'
        });
        
        console.log(`   ✅ FIXED to: ${invitationRole}\n`);
        fixedCount++;
        fixes.push({
          uid: doc.id,
          email: data.email,
          from: currentRole,
          to: invitationRole
        });
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n========================================');
    console.log(`✅ Fixed: ${fixedCount} users`);
    console.log(`⏭️  Skipped: ${skippedCount} users (no mismatch)`);
    console.log('========================================\n');
    
    if (fixes.length > 0) {
      console.log('📋 Summary of fixes:');
      fixes.forEach(fix => {
        console.log(`   ${fix.email}: ${fix.from} → ${fix.to}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAllInvitationRoles();
