/**
 * Check Athlete Coach Assignment
 *
 * This script checks if a specific athlete has a coach assigned.
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

async function checkAthleteCoach() {
  try {
    const email = 'crucibletester2@yahoo.com'
    console.log(`🔍 Checking coach assignment for: ${email}\n`)

    // Find the athlete by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.log('❌ Athlete not found')
      return
    }

    const athleteDoc = usersSnapshot.docs[0]
    const athleteData = athleteDoc.data()
    const athleteId = athleteDoc.id

    console.log('✅ Athlete found:')
    console.log(`   ID: ${'[ATHLETE_ID]')
    console.log(`   Email: ${athleteData.email}`)
    console.log(`   Name: ${athleteData.displayName || 'N/A'}`)
    console.log(`   Role: ${athleteData.role || 'N/A'}`)
    console.log(`\n📋 Coach Assignment:`)
    console.log(`   '[COACH_ID]')
    console.log(`   assignedCoachId: ${athleteData.assignedCoachId || 'NOT SET'}`)
    console.log(`   creatorUid: ${athleteData.creatorUid || 'NOT SET'}`)

    // Check if any coach ID exists
    const coachId = athleteData.coachId || athleteData.assignedCoachId || athleteData.creatorUid

    if (!coachId) {
      console.log(`\n❌ NO COACH ASSIGNED`)
      console.log(`\n💡 Solution: Assign a coach to this athlete`)
      console.log(`   Run: node scripts/assign-coach-to-athlete.js`)
      return
    }

    console.log(`\n✅ Coach ID found: ${'[COACH_ID]')

    // Fetch coach details
    const coachDoc = await db.collection('users').doc(coachId).get()

    if (!coachDoc.exists) {
      console.log(`❌ Coach document not found (${'[COACH_ID]')`)
      console.log(`\n⚠️  The athlete has a coach ID but the coach doesn't exist!`)
      return
    }

    const coachData = coachDoc.data()
    console.log(`\n✅ Coach Details:`)
    console.log(`   Name: ${coachData.displayName || coachData.email}`)
    console.log(`   Email: ${coachData.email}`)
    console.log(`   Role: ${coachData.role}`)

    console.log(`\n✅ Everything looks good! The athlete should be able to use the AI assistant.`)

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the check
checkAthleteCoach()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
