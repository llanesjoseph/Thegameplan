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

console.log('🔧 FIXING CORRUPTED SUBMISSIONS');
console.log('=' .repeat(50));

async function fixCorruptedSubmissions() {
  try {
    // Get all submissions
    const submissionsSnapshot = await db.collection('submissions').get();
    const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Found ${submissions.length} submissions`);
    
    let fixedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;
    
    for (const submission of submissions) {
      console.log(`\n🔍 Processing submission: ${submission.id}`);
      
      // Check if submission is corrupted (missing athleteId or videoUrl)
      const isCorrupted = !submission.athleteId || !submission.videoUrl;
      
      if (!isCorrupted) {
        console.log('✅ Submission is not corrupted, skipping');
        skippedCount++;
        continue;
      }
      
      console.log('⚠️ Submission is corrupted, attempting to fix...');
      
      // Try to recover athleteId from related data
      let recoveredAthleteId = null;
      let recoveredVideoUrl = null;
      
      // Check if we can find the athlete from other sources
      if (!submission.athleteId) {
        // Look for athlete in users collection with matching data
        const usersSnapshot = await db.collection('users')
          .where('role', '==', 'athlete')
          .get();
        
        // For now, we'll mark these for manual review
        console.log('❌ Cannot recover athleteId automatically');
      }
      
      // Check if we can find videoUrl from storage or other sources
      if (!submission.videoUrl) {
        console.log('❌ Cannot recover videoUrl automatically');
      }
      
      // If we can't recover the data, mark for deletion
      if (!recoveredAthleteId || !recoveredVideoUrl) {
        console.log('🗑️ Marking submission for deletion (cannot recover data)');
        
        // Update submission status to indicate it's corrupted
        await db.collection('submissions').doc(submission.id).update({
          status: 'corrupted',
          corruptedAt: new Date(),
          corruptionReason: 'Missing athleteId or videoUrl',
          needsManualReview: true
        });
        
        deletedCount++;
      } else {
        // Fix the submission with recovered data
        console.log('🔧 Fixing submission with recovered data');
        
        await db.collection('submissions').doc(submission.id).update({
          athleteId: recoveredAthleteId,
          videoUrl: recoveredVideoUrl,
          fixedAt: new Date(),
          fixedBy: 'automated-script'
        });
        
        fixedCount++;
      }
    }
    
    console.log('\n📊 FIX SUMMARY:');
    console.log(`   ✅ Fixed: ${fixedCount} submissions`);
    console.log(`   🗑️ Marked for deletion: ${deletedCount} submissions`);
    console.log(`   ⏭️ Skipped (not corrupted): ${skippedCount} submissions`);
    
    if (deletedCount > 0) {
      console.log('\n⚠️ WARNING: Some submissions were marked for deletion');
      console.log('   These need manual review before permanent deletion');
      console.log('   Check the submissions with status "corrupted"');
    }
    
  } catch (error) {
    console.error('❌ Error fixing corrupted submissions:', error);
  }
}

// Run the fix
fixCorruptedSubmissions().then(() => {
  console.log('\n🎯 SUBMISSION FIX COMPLETE!');
  process.exit(0);
}).catch(error => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
