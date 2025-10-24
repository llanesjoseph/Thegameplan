const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gameplan-787a2'
  });
}

const db = admin.firestore();

console.log('🔧 FIXING INVITATION EMAILS');
console.log('=' .repeat(40));

async function fixInvitationEmails() {
  try {
    // Get all invitations
    const invitationsSnapshot = await db.collection('invitations').get();
    const invitations = invitationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Found ${invitations.length} invitations`);
    
    let fixedCount = 0;
    let markedForReviewCount = 0;
    let skippedCount = 0;
    
    for (const invitation of invitations) {
      console.log(`\n🔍 Processing invitation: ${invitation.id}`);
      
      // Check if invitation has athleteEmail
      if (invitation.athleteEmail && invitation.athleteEmail.includes('@')) {
        console.log(`   ✅ Already has email: ${invitation.athleteEmail}`);
        skippedCount++;
        continue;
      }
      
      console.log('   ⚠️ Missing or invalid email, attempting to fix...');
      
      // Try to recover email from other sources
      let recoveredEmail = null;
      
      // Check if we can find email from related data
      if (invitation.athleteName) {
        // Look for user with matching name
        const usersSnapshot = await db.collection('users')
          .where('displayName', '==', invitation.athleteName)
          .get();
        
        if (!usersSnapshot.empty) {
          const user = usersSnapshot.docs[0].data();
          if (user.email) {
            recoveredEmail = user.email;
            console.log(`   🔧 Recovered email from user data: ${recoveredEmail}`);
          }
        }
      }
      
      // Check if we can find email from other invitation fields
      if (!recoveredEmail && invitation.email) {
        recoveredEmail = invitation.email;
        console.log(`   🔧 Found email in other field: ${recoveredEmail}`);
      }
      
      if (recoveredEmail && recoveredEmail.includes('@')) {
        // Fix the invitation with recovered email
        console.log(`   ✅ Fixing invitation with recovered email`);
        
        await db.collection('invitations').doc(invitation.id).update({
          athleteEmail: recoveredEmail.toLowerCase().trim(),
          fixedAt: new Date(),
          fixedBy: 'automated-script'
        });
        
        fixedCount++;
      } else {
        // Mark for manual review
        console.log('   ❌ Cannot recover email, marking for manual review');
        
        await db.collection('invitations').doc(invitation.id).update({
          needsManualReview: true,
          reviewReason: 'Missing athleteEmail',
          markedForReviewAt: new Date()
        });
        
        markedForReviewCount++;
      }
    }
    
    console.log('\n📊 FIX SUMMARY:');
    console.log(`   ✅ Fixed: ${fixedCount} invitations`);
    console.log(`   🔍 Marked for review: ${markedForReviewCount} invitations`);
    console.log(`   ⏭️ Skipped (already has email): ${skippedCount} invitations`);
    
    if (markedForReviewCount > 0) {
      console.log('\n⚠️ WARNING: Some invitations need manual review');
      console.log('   Check invitations with needsManualReview: true');
    }
    
    // Show status distribution
    console.log('\n📊 INVITATION STATUS DISTRIBUTION:');
    const statusCounts = {};
    for (const invitation of invitations) {
      const status = invitation.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} invitations`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing invitation emails:', error);
  }
}

// Run the fix
fixInvitationEmails().then(() => {
  console.log('\n🎯 INVITATION EMAIL FIX COMPLETE!');
  process.exit(0);
}).catch(error => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
