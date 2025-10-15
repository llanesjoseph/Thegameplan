/**
 * Fix Coach Assignment to Match Invitation
 *
 * This script reassigns the athlete to the coach who sent the invitation.
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

async function fixCoachAssignment() {
  try {
    const athleteEmail = 'crucibletester2@yahoo.com'
    console.log(`🔧 Fixing coach assignment for: ${athleteEmail}\n`)

    // Get the athlete
    const athletesSnapshot = await db.collection('users')
      .where('email', '==', athleteEmail)
      .limit(1)
      .get()

    if (athletesSnapshot.empty) {
      console.log('❌ Athlete not found')
      return
    }

    const athleteDoc = athletesSnapshot.docs[0]
    const athleteData = athleteDoc.data()
    const athleteId = athleteDoc.id

    console.log(`✅ Found athlete: ${athleteId}`)
    console.log(`   Current coach: ${athleteData.coachId}`)

    // Get the invitation
    const invitationId = athleteData.invitationId
    if (!invitationId) {
      console.log('❌ No invitation ID found')
      return
    }

    const invitationDoc = await db.collection('invitations').doc(invitationId).get()
    if (!invitationDoc.exists) {
      console.log('❌ Invitation not found')
      return
    }

    const invitationData = invitationDoc.data()
    const correctCoachId = invitationData.creatorUid

    console.log(`\n📧 Invitation sent by coach: ${correctCoachId}`)

    if (athleteData.coachId === correctCoachId) {
      console.log('\n✅ Coach assignment is already correct!')
      return
    }

    // Get coach details
    const coachDoc = await db.collection('users').doc(correctCoachId).get()
    const coachData = coachDoc.data()

    console.log(`   Coach name: ${coachData?.displayName || coachData?.email}`)
    console.log(`\n🔄 Updating coach assignment...`)

    // Update the athlete's coach assignment
    await db.collection('users').doc(athleteId).update({
      coachId: correctCoachId,
      assignedCoachId: correctCoachId,
      creatorUid: correctCoachId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      correctedBy: 'fix-coach-assignment-script',
      correctedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`\n✅ Coach assignment corrected!`)
    console.log(`   Athlete is now assigned to: ${coachData?.displayName || coachData?.email}`)

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the fix
fixCoachAssignment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
