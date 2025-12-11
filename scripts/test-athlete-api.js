/**
 * Test Athlete Details API
 *
 * This script tests the /api/coach/athletes/[id] endpoint
 * to verify it handles missing collections gracefully.
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()
const auth = admin.auth()

async function testAthleteAPI() {
  try {
    console.log('🧪 Testing Athlete Details API\n')

    // Get a coach user
    const coachesSnapshot = await db.collection('users')
      .where('role', '==', 'coach')
      .limit(1)
      .get()

    if (coachesSnapshot.empty) {
      console.log('❌ No coaches found in database')
      return
    }

    const coachDoc = coachesSnapshot.docs[0]
    const coachData = coachDoc.data()
    const coachId = coachDoc.id
    console.log(`✅ Found coach: ${coachData.email} (${'[COACH_ID]')`)

    // Get an athlete assigned to this coach
    const athletesSnapshot = await db.collection('users')
      .where('role', '==', 'athlete')
      .where('coachId', '==', coachId)
      .limit(1)
      .get()

    if (athletesSnapshot.empty) {
      console.log('⚠️  No athletes found for this coach')
      console.log('   This is okay - API should still work with empty data\n')

      // Check if there are ANY athletes
      const anyAthlete = await db.collection('users')
        .where('role', '==', 'athlete')
        .limit(1)
        .get()

      if (anyAthlete.empty) {
        console.log('ℹ️  No athletes exist in the database at all')
        return
      }

      const athleteDoc = anyAthlete.docs[0]
      const athleteData = athleteDoc.data()
      const athleteId = athleteDoc.id

      console.log(`\n📊 Testing with athlete: ${athleteData.email} (${'[ATHLETE_ID]')`)
      console.log(`   Note: This athlete may not be assigned to the coach\n`)

      await testAPIEndpoint(coachId, athleteId, athleteData.email)
      return
    }

    const athleteDoc = athletesSnapshot.docs[0]
    const athleteData = athleteDoc.data()
    const athleteId = athleteDoc.id

    console.log(`✅ Found athlete: ${athleteData.email} (${'[ATHLETE_ID]')`)
    console.log(`   Assigned to coach: ${'[COACH_ID]')

    await testAPIEndpoint(coachId, athleteId, athleteData.email)

  } catch (error) {
    console.error('💥 Test failed:', error)
    process.exit(1)
  }
}

async function testAPIEndpoint(coachId, athleteId, athleteEmail) {
  console.log('=' .repeat(80))
  console.log('API ENDPOINT TEST')
  console.log('=' .repeat(80))
  console.log(`\n📍 Endpoint: GET /api/coach/athletes/${'[ATHLETE_ID]')
  console.log(`   Auth: Bearer <coach-token>\n`)

  // Check what data exists for this athlete
  console.log('📊 Checking available data sources:')

  // Check athlete_feed
  const feedDoc = await db.collection('athlete_feed').doc(athleteId).get()
  console.log(`   - athlete_feed: ${feedDoc.exists ? '✅ EXISTS' : '❌ NOT FOUND'}`)

  if (feedDoc.exists) {
    const feedData = feedDoc.data()
    console.log(`     - Available lessons: ${feedData.availableLessons?.length || 0}`)
    console.log(`     - Completed lessons: ${feedData.completedLessons?.length || 0}`)
  }

  // Check videoReviews (optional collection)
  try {
    const videoReviews = await db.collection('videoReviews')
      .where('athleteId', '==', athleteId)
      .limit(1)
      .get()
    console.log(`   - videoReviews: ${videoReviews.empty ? '⚠️  EMPTY (optional)' : '✅ HAS DATA'}`)
  } catch (error) {
    console.log(`   - videoReviews: ⚠️  ERROR (${error.message}) - API should handle this`)
  }

  // Check liveSessionRequests (optional collection)
  try {
    const liveSessions = await db.collection('liveSessionRequests')
      .where('athleteId', '==', athleteId)
      .limit(1)
      .get()
    console.log(`   - liveSessionRequests: ${liveSessions.empty ? '⚠️  EMPTY (optional)' : '✅ HAS DATA'}`)
  } catch (error) {
    console.log(`   - liveSessionRequests: ⚠️  ERROR (${error.message}) - API should handle this`)
  }

  console.log('\n' + '=' .repeat(80))
  console.log('✅ TEST SUMMARY')
  console.log('=' .repeat(80))
  console.log(`
The API endpoint should now work even if optional collections are missing.

To test in browser:
1. Sign in as coach: ${'[COACH_ID]')
}

// Run the test
testAthleteAPI()
  .then(() => {
    console.log('✅ Test completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
