/**
 * Migration Script: Fix Lesson Collection Name
 *
 * Problem: Lessons were saved to 'content ' (with trailing space) instead of 'content'
 * Solution: Copy all lessons from 'content ' to 'content' collection
 *
 * Usage: node scripts/migrate-lessons-fix-collection-name.js
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function migrateLessons() {
  console.log('🚀 Starting lesson migration...\n')

  try {
    // 1. Get all lessons from 'content ' (with space)
    console.log('📖 Reading lessons from "content " collection (with space)...')
    const wrongCollectionRef = db.collection('content ')
    const snapshot = await wrongCollectionRef.get()

    if (snapshot.empty) {
      console.log('✅ No lessons found in "content " collection. Migration not needed!')
      return
    }

    console.log(`Found ${snapshot.size} lesson(s) in wrong collection\n`)

    // 2. Prepare migration data
    const lessonsToMigrate = []
    snapshot.forEach(doc => {
      lessonsToMigrate.push({
        id: doc.id,
        data: doc.data()
      })
      console.log(`  📝 ${doc.data().title} (ID: ${doc.id})`)
    })

    console.log('\n🔄 Starting migration process...\n')

    // 3. Copy lessons to correct 'content' collection
    const correctCollectionRef = db.collection('content')
    const batch = db.batch()

    for (const lesson of lessonsToMigrate) {
      // Check if lesson already exists in correct collection
      const existingDoc = await correctCollectionRef.doc(lesson.id).get()

      if (existingDoc.exists) {
        console.log(`⚠️  Lesson "${lesson.data.title}" already exists in correct collection - skipping`)
        continue
      }

      // Copy to correct collection with same ID
      const newDocRef = correctCollectionRef.doc(lesson.id)
      batch.set(newDocRef, lesson.data)
      console.log(`✅ Queued: "${lesson.data.title}" → content/${lesson.id}`)
    }

    // 4. Commit the batch write
    console.log('\n💾 Committing batch write to Firestore...')
    await batch.commit()
    console.log('✅ All lessons successfully copied to "content" collection!\n')

    // 5. Verify migration
    console.log('🔍 Verifying migration...')
    const verifySnapshot = await correctCollectionRef.get()
    const migratedCount = verifySnapshot.size
    console.log(`✅ Verified: ${migratedCount} lesson(s) now in "content" collection\n`)

    // 6. Ask user if they want to delete old collection
    console.log('⚠️  NEXT STEPS:')
    console.log('   1. Check Firebase Console to verify lessons appear correctly')
    console.log('   2. Test creating a new lesson to confirm it works')
    console.log('   3. If everything looks good, you can manually delete the "content " collection\n')

    console.log('📋 Old lessons in "content " (with space):')
    lessonsToMigrate.forEach(lesson => {
      console.log(`   - ${lesson.data.title} (${lesson.id})`)
    })

    console.log('\n⚠️  To delete the old collection, run this in Firebase Console:')
    console.log('   Go to Firestore → Find "content " collection → Delete collection\n')

    console.log('🎉 Migration complete!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateLessons()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
