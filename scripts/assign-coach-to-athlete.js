/**
 * Assign Coach to Athlete
 *
 * This script assigns a coach to an athlete by setting the coachId field.
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

async function assignCoachToAthlete() {
  try {
    const athleteEmail = 'crucibletester2@yahoo.com'

    console.log(`🔍 Finding athlete: ${athleteEmail}\n`)

    // Find the athlete
    const athletesSnapshot = await db.collection('users')
      .where('email', '==', athleteEmail)
      .limit(1)
      .get()

    if (athletesSnapshot.empty) {
      console.log('❌ Athlete not found')
      return
    }

    const athleteDoc = athletesSnapshot.docs[0]
    const athleteId = athleteDoc.id
    console.log(`✅ Athlete found: ${'[ATHLETE_ID]')

    // Find a coach to assign
    console.log(`\n🔍 Finding available coaches...\n`)

    const coachesSnapshot = await db.collection('users')
      .where('role', '==', 'coach')
      .limit(5)
      .get()

    if (coachesSnapshot.empty) {
      console.log('❌ No coaches found in the system')
      return
    }

    console.log(`Found ${coachesSnapshot.docs.length} coaches:`)
    coachesSnapshot.docs.forEach((doc, index) => {
      const coachData = doc.data()
      console.log(`   ${index + 1}. ${coachData.displayName || coachData.email} (${doc.id})`)
    })

    // Use the first coach
    const coachDoc = coachesSnapshot.docs[0]
    const coachData = coachDoc.data()
    const coachId = coachDoc.id

    console.log(`\n📝 Assigning coach: ${coachData.displayName || coachData.email}`)
    console.log(`   Coach ID: ${'[COACH_ID]')
    console.log(`   Athlete ID: ${'[ATHLETE_ID]')

    // Update the athlete document
    await db.collection('users').doc(athleteId).update({
      coachId: coachId,
      assignedCoachId: coachId,
      creatorUid: coachId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`\n✅ Coach successfully assigned!`)
    console.log(`\n💡 The athlete can now use the AI assistant.`)
    console.log(`   They may need to refresh their dashboard to see the changes.`)

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the assignment
assignCoachToAthlete()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
