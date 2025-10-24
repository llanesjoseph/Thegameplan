/**
 * Fix LONA's Coach Assignment
 * Updates the athlete's user document with proper coach assignment fields
 */

const admin = require('firebase-admin')
const path = require('path')

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json')
const serviceAccount = require(serviceAccountPath)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function fixLonaCoachAssignment() {
  try {
    const athleteUid = 'A7gHpwxqLgeMtoayVeK6dpZ5fLf1'
    const coachUid = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2'
    const invitationId = 'athlete-invite-1760636461706-mknbrw'

    console.log(`\n🔧 Fixing LONA's coach assignment...`)
    console.log('=' .repeat(80))
    console.log(`Athlete UID: ${athleteUid}`)
    console.log(`Coach UID: ${coachUid} (Joseph Llanes)`)
    console.log(`Invitation ID: ${invitationId}`)

    // Get current user document
    const userDoc = await db.collection('users').doc(athleteUid).get()

    if (!userDoc.exists) {
      console.log(`\n❌ User document not found`)
      return
    }

    const userData = userDoc.data()

    console.log(`\n\n📋 CURRENT STATE:`)
    console.log('─'.repeat(80))
    console.log(`Display Name: ${userData.displayName}`)
    console.log(`Email: ${userData.email}`)
    console.log(`Role: ${userData.role}`)
    console.log(`creatorUid: ${userData.creatorUid || '❌ NOT SET'}`)
    console.log(`'[COACH_ID]')
    console.log(`assignedCoachId: ${userData.assignedCoachId || '❌ NOT SET'}`)
    console.log(`'[ATHLETE_ID]')
    console.log(`invitationId: ${userData.invitationId || '❌ NOT SET'}`)

    // Update the user document with coach assignments
    console.log(`\n\n🔧 Applying fix...`)
    console.log('─'.repeat(80))

    const updateData = {
      creatorUid: coachUid,
      coachId: coachUid,
      assignedCoachId: coachUid,
      invitationId: invitationId,
      invitationRole: 'athlete',
      invitationType: 'athlete_invitation',
      roleSource: 'invitation',
      roleLockedByInvitation: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }

    await db.collection('users').doc(athleteUid).update(updateData)

    console.log(`✅ User document updated with coach assignments`)

    // Verify the update
    const updatedDoc = await db.collection('users').doc(athleteUid).get()
    const updatedData = updatedDoc.data()

    console.log(`\n\n✅ UPDATED STATE:`)
    console.log('─'.repeat(80))
    console.log(`creatorUid: ${updatedData.creatorUid}`)
    console.log(`'[COACH_ID]')
    console.log(`assignedCoachId: ${updatedData.assignedCoachId}`)
    console.log(`invitationId: ${updatedData.invitationId}`)

    // Verify all fields match expected coach UID
    const allFieldsCorrect = (
      updatedData.creatorUid === coachUid &&
      updatedData.coachId === coachUid &&
      updatedData.assignedCoachId === coachUid
    )

    console.log(`\n\n${allFieldsCorrect ? '✅' : '❌'} VERIFICATION: ${allFieldsCorrect ? 'All fields correctly set!' : 'Some fields still incorrect'}`)

    // Get coach details
    const coachDoc = await db.collection('users').doc(coachUid).get()
    const coachData = coachDoc.data()

    console.log(`\n\n👨‍🏫 ASSIGNED COACH:`)
    console.log('─'.repeat(80))
    console.log(`Name: ${coachData.displayName}`)
    console.log(`Email: ${coachData.email}`)
    console.log(`Total athletes: ${coachData.athletes?.length || 0}`)

    // Verify athlete is in coach's list
    const athletesList = coachData.athletes || []
    const athleteInList = athletesList.find(a => a.uid === athleteUid)

    console.log(`\n${athleteInList ? '✅' : '❌'} Athlete in coach's athletes list: ${athleteInList ? 'YES' : 'NO'}`)

    if (athleteInList) {
      console.log(`  Name: ${athleteInList.name}`)
      console.log(`  Sport: ${athleteInList.sport}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Fix complete!')
    console.log('\n💡 LONA should now be properly assigned to Coach Joseph Llanes')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

fixLonaCoachAssignment()
