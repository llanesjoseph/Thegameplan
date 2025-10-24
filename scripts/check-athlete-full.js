/**
 * Check Full Athlete Record
 *
 * This script checks the complete athlete record including invitation tracking.
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

async function checkAthleteFullRecord() {
  try {
    const email = 'crucibletester2@yahoo.com'
    console.log(`🔍 Checking full record for: ${email}\n`)

    // Find the athlete in users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.log('❌ Athlete not found in users collection')
      return
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    console.log('=' .repeat(80))
    console.log('USER DOCUMENT')
    console.log('=' .repeat(80))
    console.log(JSON.stringify(userData, null, 2))

    console.log('\n' + '='.repeat(80))
    console.log('INVITATION TRACKING')
    console.log('=' .repeat(80))
    console.log(`invitationId: ${userData.invitationId || 'NOT SET'}`)
    console.log(`invitationRole: ${userData.invitationRole || 'NOT SET'}`)
    console.log(`invitationType: ${userData.invitationType || 'NOT SET'}`)
    console.log(`roleSource: ${userData.roleSource || 'NOT SET'}`)
    console.log(`creatorUid: ${userData.creatorUid || 'NOT SET'}`)

    console.log('\n' + '='.repeat(80))
    console.log('COACH ASSIGNMENT')
    console.log('=' .repeat(80))
    console.log(`'[COACH_ID]')
    console.log(`assignedCoachId: ${userData.assignedCoachId || 'NOT SET'}`)

    // Check if there's an athletes document
    const athleteId = userData.athleteId
    if (athleteId) {
      const athleteDoc = await db.collection('athletes').doc(athleteId).get()
      if (athleteDoc.exists) {
        console.log('\n' + '='.repeat(80))
        console.log('ATHLETE DOCUMENT')
        console.log('=' .repeat(80))
        console.log(JSON.stringify(athleteDoc.data(), null, 2))
      }
    }

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the check
checkAthleteFullRecord()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
