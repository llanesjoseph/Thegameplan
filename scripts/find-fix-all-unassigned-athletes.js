/**
 * Find and Fix All Unassigned Athletes
 * Finds all athletes who are missing coach assignments and fixes them
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

async function findAndFixUnassignedAthletes() {
  try {
    console.log(`\n🔍 Finding all athletes with missing coach assignments...`)
    console.log('=' .repeat(80))

    // Get all users with role 'athlete'
    const athletesSnapshot = await db.collection('users')
      .where('role', '==', 'athlete')
      .get()

    console.log(`\n📊 Found ${athletesSnapshot.size} total athletes`)

    const unassignedAthletes = []

    athletesSnapshot.forEach(doc => {
      const data = doc.data()
      const hasCoachAssignment = data.creatorUid || data.coachId || data.assignedCoachId

      if (!hasCoachAssignment) {
        unassignedAthletes.push({
          uid: doc.id,
          ...data
        })
      }
    })

    console.log(`\n❌ Found ${unassignedAthletes.length} athlete(s) missing coach assignments\n`)

    if (unassignedAthletes.length === 0) {
      console.log('✅ All athletes have proper coach assignments!')
      return
    }

    // For each unassigned athlete, try to find their invitation and fix the assignment
    for (const athlete of unassignedAthletes) {
      console.log(`\n${'─'.repeat(80)}`)
      console.log(`👤 ATHLETE: ${athlete.displayName} (${athlete.email})`)
      console.log(`   UID: ${athlete.uid}`)

      // Try to find invitation by email
      const invitationsSnapshot = await db.collection('invitations')
        .where('athleteEmail', '==', athlete.email)
        .get()

      if (invitationsSnapshot.empty) {
        console.log(`   ⚠️ No invitation found for this athlete - SKIPPING`)
        continue
      }

      // Get the most recent invitation
      const invitations = []
      invitationsSnapshot.forEach(doc => {
        invitations.push({ id: doc.id, ...doc.data() })
      })

      // Sort by creation date (most recent first)
      invitations.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
        return bDate - aDate
      })

      const invitation = invitations[0]

      if (!invitation.creatorUid) {
        console.log(`   ⚠️ Invitation found but has no creatorUid - SKIPPING`)
        continue
      }

      console.log(`   📧 Found invitation: ${invitation.id}`)
      console.log(`   👨‍🏫 Coach UID: ${invitation.creatorUid}`)

      // Get coach details
      const coachDoc = await db.collection('users').doc(invitation.creatorUid).get()
      if (!coachDoc.exists) {
        console.log(`   ⚠️ Coach not found in database - SKIPPING`)
        continue
      }

      const coachData = coachDoc.data()
      console.log(`   👨‍🏫 Coach Name: ${coachData.displayName} (${coachData.email})`)

      // Update athlete's user document
      const updateData = {
        creatorUid: invitation.creatorUid,
        coachId: invitation.creatorUid,
        assignedCoachId: invitation.creatorUid,
        invitationId: invitation.id,
        invitationRole: 'athlete',
        invitationType: 'athlete_invitation',
        roleSource: 'invitation',
        roleLockedByInvitation: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }

      await db.collection('users').doc(athlete.uid).update(updateData)
      console.log(`   ✅ FIXED: Assigned to coach ${coachData.displayName}`)

      // Verify athlete is in coach's athletes list
      const athletesList = coachData.athletes || []
      const athleteInList = athletesList.find(a => a.uid === athlete.uid || a.email === athlete.email)

      if (athleteInList) {
        console.log(`   ✅ Athlete already in coach's list`)
      } else {
        console.log(`   ⚠️ Athlete NOT in coach's list - coach may need to refresh`)
      }
    }

    console.log(`\n\n${'='.repeat(80)}`)
    console.log(`✅ Fix complete!`)
    console.log(`   Fixed: ${unassignedAthletes.filter(a => a.fixed).length} athlete(s)`)
    console.log(`   Skipped: ${unassignedAthletes.filter(a => !a.fixed).length} athlete(s)`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

findAndFixUnassignedAthletes()
