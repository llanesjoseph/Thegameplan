/**
 * Check Invitation Details
 *
 * This script checks if an athlete's invitation has the coach ID stored.
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

async function checkInvitation() {
  try {
    const athleteEmail = 'crucibletester2@yahoo.com'
    console.log(`🔍 Checking invitation for: ${athleteEmail}\n`)

    // Find invitations for this email
    const invitationsSnapshot = await db.collection('invitations')
      .where('athleteEmail', '==', athleteEmail.toLowerCase())
      .get()

    if (invitationsSnapshot.empty) {
      console.log('❌ No invitation found for this email')
      return
    }

    console.log(`Found ${invitationsSnapshot.docs.length} invitation(s):\n`)

    invitationsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data()
      console.log(`Invitation ${index + 1}:`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Athlete Email: ${data.athleteEmail}`)
      console.log(`  Athlete Name: ${data.athleteName}`)
      console.log(`  Creator UID (Coach ID): ${data.creatorUid || 'NOT SET ❌'}`)
      console.log(`  Status: ${data.status}`)
      console.log(`  Used: ${data.used}`)
      console.log(`  Role: ${data.role}`)
      console.log(`  Sport: ${data.sport}`)
      console.log(`  Created At: ${data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}`)
      console.log(`  Used At: ${data.usedAt?.toDate?.()?.toLocaleString() || 'N/A'}`)
      console.log('')

      if (!data.creatorUid) {
        console.log('⚠️  WARNING: This invitation is missing creatorUid (coach ID)!')
        console.log('   The athlete won\'t be assigned to a coach when they accept.\n')
      }
    })

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the check
checkInvitation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
