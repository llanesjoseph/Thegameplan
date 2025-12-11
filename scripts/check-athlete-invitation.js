/**
 * Check Athlete Invitation Assignment
 * Verifies that the athlete invitation has the correct coach assignment
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

async function checkAthleteInvitation() {
  try {
    const athleteEmail = 'lonallorraine.vincent@gmail.com' // Normalize email

    console.log(`\n🔍 Searching for invitation to: ${athleteEmail}`)
    console.log('=' .repeat(70))

    // Find invitation by athlete email
    const invitationsSnapshot = await db.collection('invitations')
      .where('athleteEmail', '==', athleteEmail)
      .get()

    if (invitationsSnapshot.empty) {
      console.log('❌ No invitation found for this email')

      // Try case-insensitive search
      console.log('\n🔍 Trying alternate email formats...')
      const allInvitations = await db.collection('invitations').get()
      const matchingInvites = []

      allInvitations.forEach(doc => {
        const data = doc.data()
        if (data.athleteEmail && data.athleteEmail.toLowerCase() === athleteEmail.toLowerCase()) {
          matchingInvites.push({ id: doc.id, ...data })
        }
      })

      if (matchingInvites.length === 0) {
        console.log('❌ No invitation found with any email format')
        return
      }

      console.log(`✅ Found ${matchingInvites.length} invitation(s) with case-insensitive match`)
      matchingInvites.forEach(inv => {
        console.log(`\nInvitation ID: ${inv.id}`)
        console.log(`Email (stored): ${inv.athleteEmail}`)
        console.log(`Created by: ${inv.createdByName || 'Unknown'} (${inv.createdBy || 'N/A'})`)
        console.log(`Coach UID (creatorUid): ${inv.creatorUid || '❌ NOT SET'}`)
        console.log(`Coach ID ('[COACH_ID]'): ${inv.coachId || 'N/A'}`)
        console.log(`Coach Name: ${inv.coachName || 'N/A'}`)
        console.log(`Status: ${inv.status}`)
        console.log(`Role: ${inv.role || inv.type}`)
      })

      return
    }

    console.log(`✅ Found ${invitationsSnapshot.size} invitation(s)`)

    invitationsSnapshot.forEach(doc => {
      const data = doc.data()
      console.log(`\n📧 INVITATION: ${doc.id}`)
      console.log('─'.repeat(70))
      console.log(`Athlete Name: ${data.athleteName}`)
      console.log(`Athlete Email: ${data.athleteEmail}`)
      console.log(`Sport: ${data.sport}`)
      console.log(`Status: ${data.status}`)
      console.log(`Role/Type: ${data.role || data.type}`)
      console.log(`\n👤 COACH ASSIGNMENT:`)
      console.log(`  creatorUid: ${data.creatorUid || '❌ NOT SET'}`)
      console.log(`  '[COACH_ID]')
      console.log(`  coachName: ${data.coachName || 'N/A'}`)
      console.log(`\n📋 METADATA:`)
      console.log(`  Created by (admin): ${data.createdByName || 'Unknown'} (${data.createdBy || 'N/A'})`)
      console.log(`  Created at: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 'N/A'}`)
      console.log(`  Used: ${data.used ? 'Yes' : 'No'}`)

      if (data.used && data.usedBy) {
        console.log(`  Used by (athlete UID): ${data.usedBy}`)
        console.log(`  Used at: ${data.usedAt?.toDate ? data.usedAt.toDate().toISOString() : 'N/A'}`)
      }
    })

    // If invitation was used, check the athlete's user document
    const invitation = invitationsSnapshot.docs[0]?.data()
    if (invitation?.used && invitation?.usedBy) {
      console.log(`\n\n🔍 Checking athlete's user document...`)
      console.log('=' .repeat(70))

      const userDoc = await db.collection('users').doc(invitation.usedBy).get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        console.log(`\n👤 USER DOCUMENT: ${userDoc.id}`)
        console.log('─'.repeat(70))
        console.log(`Display Name: ${userData.displayName}`)
        console.log(`Email: ${userData.email}`)
        console.log(`Role: ${userData.role}`)
        console.log(`\n👨‍🏫 COACH ASSIGNMENTS:`)
        console.log(`  creatorUid: ${userData.creatorUid || '❌ NOT SET'}`)
        console.log(`  '[COACH_ID]')
        console.log(`  assignedCoachId: ${userData.assignedCoachId || '❌ NOT SET'}`)

        // Get coach info if coachId is set
        const coachUid = userData.coachId || userData.assignedCoachId || userData.creatorUid
        if (coachUid) {
          const coachDoc = await db.collection('users').doc(coachUid).get()
          if (coachDoc.exists) {
            const coachData = coachDoc.data()
            console.log(`\n✅ ASSIGNED COACH DETAILS:`)
            console.log(`  Coach UID: ${coachUid}`)
            console.log(`  Coach Name: ${coachData.displayName}`)
            console.log(`  Coach Email: ${coachData.email}`)
            console.log(`  Coach Role: ${coachData.role}`)
          } else {
            console.log(`\n⚠️ Coach document not found for UID: ${coachUid}`)
          }
        } else {
          console.log(`\n❌ NO COACH ASSIGNED`)
        }
      } else {
        console.log(`❌ User document not found for UID: ${invitation.usedBy}`)
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ Check complete')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkAthleteInvitation()
