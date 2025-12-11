/**
 * Verify Joseph's Profile and Clear Cache
 * Checks which collection Joseph's profile is in and verifies sport data
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'gameplan-787a2',
      })
      console.log('🔥 Firebase Admin initialized\n')
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'gameplan-787a2',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: 'gameplan-787a2',
      })
      console.log('🔥 Firebase Admin initialized\n')
    } else {
      console.log('⚠️  Running without Firebase credentials')
      process.exit(1)
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    process.exit(1)
  }
}

const db = admin.firestore()

async function verifyJosephProfile() {
  console.log('═'.repeat(80))
  console.log('🔍 VERIFY JOSEPH\'S PROFILE AND CLEAR CACHE')
  console.log('═'.repeat(80))
  console.log()

  // Find Joseph's user ID
  const usersSnap = await db.collection('users')
    .where('email', '==', 'jiu_jitsu_coaching@gmail.com')
    .limit(1)
    .get()

  if (usersSnap.empty) {
    console.log('❌ Could not find Joseph\'s user account')
    process.exit(1)
  }

  const joseph = usersSnap.docs[0]
  const josephId = joseph.id
  const josephData = joseph.data()

  console.log('✅ FOUND JOSEPH\'S USER ACCOUNT')
  console.log(`   ID: ${josephId}`)
  console.log(`   Name: ${josephData.displayName || 'N/A'}`)
  console.log(`   Email: ${josephData.email}`)
  console.log(`   Sport: ${josephData.sport || 'NOT SET IN USERS'}`)
  console.log(`   Role: ${josephData.role || josephData.accountType || 'N/A'}`)
  console.log()

  // Check all possible collections for coach profile
  const collections = ['coaches', 'coach_profiles', 'creator_profiles', 'creatorPublic', 'users']

  console.log('🔍 CHECKING ALL COLLECTIONS FOR JOSEPH\'S PROFILE')
  console.log('─'.repeat(80))

  for (const collectionName of collections) {
    try {
      const doc = await db.collection(collectionName).doc(josephId).get()

      if (doc.exists) {
        const data = doc.data()
        console.log(`\n✅ FOUND in ${collectionName}:`)
        console.log(`   displayName: ${data.displayName || data.name || 'N/A'}`)
        console.log(`   sport: ${data.sport || 'NOT SET'}`)
        console.log(`   bio: ${data.bio ? data.bio.substring(0, 100) + '...' : 'NOT SET'}`)
        console.log(`   photoURL: ${data.photoURL || data.profileImageUrl || 'NOT SET'}`)
      } else {
        console.log(`   ❌ NOT in ${collectionName}`)
      }
    } catch (error) {
      console.log(`   ⚠️  Error checking ${collectionName}: ${error.message}`)
    }
  }

  console.log()
  console.log('─'.repeat(80))
  console.log('📚 CHECKING JOSEPH\'S LESSONS')
  console.log('─'.repeat(80))

  const lessonsSnap = await db.collection('content')
    .where('creatorUid', '==', josephId)
    .where('status', '==', 'published')
    .limit(10)
    .get()

  console.log(`\nFound ${lessonsSnap.size} published lessons`)

  let videoCount = 0
  let textCount = 0

  lessonsSnap.forEach(doc => {
    const data = doc.data()
    const hasVideo = !!(data.videoUrl || data.videoId)
    const hasText = !!(data.content || data.longDescription)

    if (hasVideo) videoCount++
    if (hasText) textCount++

    console.log(`\n  📄 ${data.title || 'Untitled'}`)
    console.log(`     Type: ${hasVideo ? 'Video' : ''}${hasVideo && hasText ? ' + ' : ''}${hasText ? 'Text' : ''}`)
    console.log(`     Sport: ${data.sport || 'N/A'}`)
  })

  console.log(`\n  Summary: ${videoCount} video lessons, ${textCount} text lessons`)

  console.log()
  console.log('═'.repeat(80))
  console.log('✅ VERIFICATION COMPLETE')
  console.log('═'.repeat(80))
  console.log()
  console.log('🔧 RECOMMENDED ACTIONS:')
  console.log('   1. Ensure Joseph\'s profile has sport="BJJ" or "Brazilian Jiu-Jitsu"')
  console.log('   2. Clear the AI cache by restarting the dev server')
  console.log('   3. Test the AI assistant again')
  console.log()

  process.exit(0)
}

verifyJosephProfile().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
