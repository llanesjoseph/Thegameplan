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

console.log('🔧 FIXING CONTENT TYPES');
console.log('=' .repeat(40));

function determineContentType(content) {
  // Analyze content to determine appropriate type
  if (content.videoUrl || content.video) {
    return 'video_lesson';
  }
  
  if (content.exercises && Array.isArray(content.exercises)) {
    return 'exercise_lesson';
  }
  
  if (content.instructions || content.steps) {
    return 'instruction_lesson';
  }
  
  if (content.quiz || content.questions) {
    return 'quiz_lesson';
  }
  
  if (content.workout || content.routine) {
    return 'workout_lesson';
  }
  
  // Default fallback
  return 'lesson';
}

async function fixContentTypes() {
  try {
    // Get all content items
    const contentSnapshot = await db.collection('content').get();
    const contentItems = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Found ${contentItems.length} content items`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const content of contentItems) {
      console.log(`\n🔍 Processing content: ${content.id}`);
      console.log(`   Title: ${content.title || 'No title'}`);
      
      // Check if content already has type
      if (content.type && content.type !== 'undefined') {
        console.log(`   ✅ Already has type: ${content.type}`);
        skippedCount++;
        continue;
      }
      
      // Determine appropriate type
      const contentType = determineContentType(content);
      console.log(`   🔧 Adding type: ${contentType}`);
      
      // Update content with type field
      await db.collection('content').doc(content.id).update({
        type: contentType,
        updatedAt: new Date(),
        typeAddedBy: 'automated-script'
      });
      
      fixedCount++;
    }
    
    console.log('\n📊 FIX SUMMARY:');
    console.log(`   ✅ Fixed: ${fixedCount} content items`);
    console.log(`   ⏭️ Skipped (already has type): ${skippedCount} content items`);
    
    // Show type distribution
    console.log('\n📊 CONTENT TYPE DISTRIBUTION:');
    const typeCounts = {};
    for (const content of contentItems) {
      const type = content.type || 'undefined';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} items`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing content types:', error);
  }
}

// Run the fix
fixContentTypes().then(() => {
  console.log('\n🎯 CONTENT TYPE FIX COMPLETE!');
  process.exit(0);
}).catch(error => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
