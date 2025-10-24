/**
 * Check Voice Capture Data in Invitation
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function checkInvitationVoiceData() {
  try {
    const coachId = 'vfEzchS1EVbsu73U1u8XRXwKBSW2' // Crucible1
    console.log(`🔍 Checking invitation voice data for coach: ${'[COACH_ID]')

    // Find the invitation for this coach
    const invitationsSnapshot = await db.collection('invitations')
      .where('role', 'in', ['coach', 'creator'])
      .where('used', '==', true)
      .where('usedBy', '==', coachId)
      .limit(1)
      .get()

    if (invitationsSnapshot.empty) {
      console.log('❌ No used invitation found for this coach')
      return
    }

    const invitationDoc = invitationsSnapshot.docs[0]
    const invitationData = invitationDoc.data()

    console.log('Invitation ID:', invitationDoc.id)
    console.log('\nCoach Profile in Invitation:')

    if (invitationData.coachProfile) {
      console.log(JSON.stringify(invitationData.coachProfile, null, 2))
    } else {
      console.log('❌ No coachProfile found in invitation')
    }

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

checkInvitationVoiceData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
