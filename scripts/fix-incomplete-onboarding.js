/**
 * Fix Incomplete Athlete Onboarding
 *
 * This script finds athletes who have:
 * - A user account (Firebase Auth + users collection)
 * - An invitation that's marked as "used"
 * - BUT missing the invitation tracking fields
 *
 * It then fixes these accounts by adding the missing fields, including coach assignment.
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

async function fixIncompleteOnboarding() {
  try {
    console.log('🔍 Finding athletes with incomplete onboarding...\n')

    // Get all users with athlete role
    const athletesSnapshot = await db.collection('users')
      .where('role', '==', 'athlete')
      .get()

    console.log(`Found ${athletesSnapshot.docs.length} athletes\n`)

    let fixedCount = 0
    const issues = []

    for (const userDoc of athletesSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id
      const email = userData.email

      // Check if this athlete is missing invitation tracking
      if (!userData.invitationId) {
        console.log(`⚠️  ${email}: Missing invitationId`)

        // Find their invitation
        const invitationsSnapshot = await db.collection('invitations')
          .where('athleteEmail', '==', email?.toLowerCase())
          .where('used', '==', true)
          .where('role', '==', 'athlete')
          .limit(1)
          .get()

        if (!invitationsSnapshot.empty) {
          const invitationDoc = invitationsSnapshot.docs[0]
          const invitationData = invitationDoc.data()
          const invitationId = invitationDoc.id

          console.log(`   Found invitation: ${invitationId}`)
          console.log(`   Coach ID: ${invitationData.creatorUid}`)

          // Check if coach assignment is missing
          const needsCoachAssignment = !userData.coachId || !userData.assignedCoachId

          if (needsCoachAssignment || !userData.invitationId) {
            console.log(`   🔧 Fixing onboarding...`)

            const updateData = {
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              fixedBy: 'fix-incomplete-onboarding-script',
              fixedAt: admin.firestore.FieldValue.serverTimestamp()
            }

            // Add missing fields
            if (!userData.invitationId) {
              updateData.invitationId = invitationId
              updateData.invitationRole = 'athlete'
              updateData.invitationType = 'athlete_invitation'
              updateData.roleSource = 'invitation'
              updateData.roleLockedByInvitation = true
            }

            // Add coach assignment if missing
            if (needsCoachAssignment && invitationData.creatorUid) {
              updateData.coachId = invitationData.creatorUid
              updateData.assignedCoachId = invitationData.creatorUid
              updateData.creatorUid = invitationData.creatorUid
            }

            await db.collection('users').doc(userId).update(updateData)

            console.log(`   ✅ Fixed!`)
            fixedCount++
          }
        } else {
          console.log(`   ❌ No invitation found for this athlete`)
          issues.push({ email, issue: 'no_invitation_found' })
        }

        console.log('')
      }
    }

    console.log('=' .repeat(80))
    console.log('SUMMARY')
    console.log('=' .repeat(80))
    console.log(`Total athletes checked: ${athletesSnapshot.docs.length}`)
    console.log(`Athletes fixed: ${fixedCount}`)
    console.log(`Athletes with issues: ${issues.length}`)

    if (issues.length > 0) {
      console.log('\nAthletes with unresolved issues:')
      issues.forEach(({ email, issue }) => {
        console.log(`  - ${email}: ${issue}`)
      })
    }

    console.log('\n✅ Incomplete onboarding fix complete!')

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the fix
fixIncompleteOnboarding()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
