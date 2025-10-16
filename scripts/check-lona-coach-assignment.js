/**
 * Check LONA's Coach Assignment
 * Verify if the athlete user document has proper coach assignment
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

async function checkLonaCoachAssignment() {
  try {
    const athleteUid = 'A7gHpwxqLgeMtoayVeK6dpZ5fLf1'
    const expectedCoachUid = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2'

    console.log(`\n🔍 Checking LONA's coach assignment...`)
    console.log('=' .repeat(80))
    console.log(`Athlete UID: ${athleteUid}`)
    console.log(`Expected Coach UID: ${expectedCoachUid} (Joseph Llanes)`)

    // Get athlete's user document
    const userDoc = await db.collection('users').doc(athleteUid).get()

    if (!userDoc.exists) {
      console.log(`\n❌ User document not found for UID: ${athleteUid}`)
      return
    }

    const userData = userDoc.data()

    console.log(`\n\n📋 ATHLETE USER DOCUMENT:`)
    console.log('─'.repeat(80))
    console.log(`Display Name: ${userData.displayName}`)
    console.log(`Email: ${userData.email}`)
    console.log(`Role: ${userData.role}`)
    console.log(`Athlete ID: ${userData.athleteId || 'N/A'}`)

    console.log(`\n\n👨‍🏫 COACH ASSIGNMENT FIELDS:`)
    console.log('─'.repeat(80))
    console.log(`creatorUid: ${userData.creatorUid || '❌ NOT SET'}`)
    console.log(`coachId: ${userData.coachId || '❌ NOT SET'}`)
    console.log(`assignedCoachId: ${userData.assignedCoachId || '❌ NOT SET'}`)

    // Check which fields are correctly set
    const hasCreatorUid = userData.creatorUid === expectedCoachUid
    const hasCoachId = userData.coachId === expectedCoachUid
    const hasAssignedCoachId = userData.assignedCoachId === expectedCoachUid

    console.log(`\n\n✅ VERIFICATION:`)
    console.log('─'.repeat(80))
    console.log(`creatorUid matches: ${hasCreatorUid ? '✅ YES' : '❌ NO'}`)
    console.log(`coachId matches: ${hasCoachId ? '✅ YES' : '❌ NO'}`)
    console.log(`assignedCoachId matches: ${hasAssignedCoachId ? '✅ YES' : '❌ NO'}`)

    if (!hasCreatorUid && !hasCoachId && !hasAssignedCoachId) {
      console.log(`\n\n❌ PROBLEM IDENTIFIED: No coach assignment fields are correctly set!`)
      console.log(`\nExpected all three fields to contain: ${expectedCoachUid}`)
      console.log(`But found:`)
      console.log(`  creatorUid: ${userData.creatorUid || 'NOT SET'}`)
      console.log(`  coachId: ${userData.coachId || 'NOT SET'}`)
      console.log(`  assignedCoachId: ${userData.assignedCoachId || 'NOT SET'}`)
    } else if (hasCreatorUid && hasCoachId && hasAssignedCoachId) {
      console.log(`\n✅ All coach assignment fields are correctly set!`)
    } else {
      console.log(`\n⚠️ PARTIAL ASSIGNMENT: Some fields are correct, some are not`)
    }

    // Get coach details
    console.log(`\n\n🔍 Fetching coach details...`)
    console.log('─'.repeat(80))

    const coachDoc = await db.collection('users').doc(expectedCoachUid).get()

    if (coachDoc.exists) {
      const coachData = coachDoc.data()
      console.log(`\n👨‍🏫 COACH: Joseph Llanes`)
      console.log(`  UID: ${expectedCoachUid}`)
      console.log(`  Name: ${coachData.displayName}`)
      console.log(`  Email: ${coachData.email}`)
      console.log(`  Role: ${coachData.role}`)

      // Check if athlete is in coach's athletes list
      const athletesList = coachData.athletes || []
      const athleteInList = athletesList.find(a => a.uid === athleteUid || a.id === userData.athleteId)

      console.log(`\n\n📋 COACH'S ATHLETES LIST:`)
      console.log('─'.repeat(80))
      console.log(`Total athletes: ${athletesList.length}`)
      console.log(`LONA in list: ${athleteInList ? '✅ YES' : '❌ NO'}`)

      if (athleteInList) {
        console.log(`  Name: ${athleteInList.name}`)
        console.log(`  Email: ${athleteInList.email}`)
        console.log(`  Sport: ${athleteInList.sport}`)
        console.log(`  Joined: ${athleteInList.joinedAt?.toDate ? athleteInList.joinedAt.toDate().toISOString() : 'N/A'}`)
      } else {
        console.log(`\n❌ PROBLEM: Athlete is NOT in coach's athletes list!`)
      }
    }

    // Get athlete document
    if (userData.athleteId) {
      console.log(`\n\n🔍 Checking athlete document...`)
      console.log('─'.repeat(80))

      const athleteDoc = await db.collection('athletes').doc(userData.athleteId).get()

      if (athleteDoc.exists) {
        const athleteData = athleteDoc.data()
        console.log(`\n📋 ATHLETE DOCUMENT: ${userData.athleteId}`)
        console.log(`  creatorUid: ${athleteData.creatorUid || '❌ NOT SET'}`)
        console.log(`  creatorUid matches: ${athleteData.creatorUid === expectedCoachUid ? '✅ YES' : '❌ NO'}`)
      } else {
        console.log(`❌ Athlete document not found: ${userData.athleteId}`)
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Check complete')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkLonaCoachAssignment()
