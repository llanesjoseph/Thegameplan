/**
 * Check Coach Invitation Link
 * Verify what's wrong with the coach invitation
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

async function checkCoachInvitation() {
  try {
    const invitationId = 'coach-1760837949034-at5qu4028pm'

    console.log(`\n🔍 Checking coach invitation: ${invitationId}`)
    console.log('=' .repeat(80))

    // Check in coach_ingestion collection
    console.log('\n📋 Checking coach_ingestion collection...')
    const ingestionDoc = await db.collection('coach_ingestion').doc(invitationId).get()

    if (ingestionDoc.exists) {
      const data = ingestionDoc.data()
      console.log(`\n✅ Found in coach_ingestion:`)
      console.log(`  ID: ${ingestionDoc.id}`)
      console.log(`  Email: ${data.coachEmail || 'N/A'}`)
      console.log(`  Name: ${data.coachName || 'N/A'}`)
      console.log(`  Sport: ${data.sport || 'N/A'}`)
      console.log(`  Status: ${data.status || 'N/A'}`)
      console.log(`  Used: ${data.used ? 'Yes' : 'No'}`)
      console.log(`  Expires: ${data.expiresAt?.toDate ? data.expiresAt.toDate().toISOString() : 'N/A'}`)
      console.log(`  Created: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 'N/A'}`)
    } else {
      console.log(`❌ Not found in coach_ingestion collection`)
    }

    // Check in invitations collection
    console.log(`\n📧 Checking invitations collection...`)
    const invitationDoc = await db.collection('invitations').doc(invitationId).get()

    if (invitationDoc.exists) {
      const data = invitationDoc.data()
      console.log(`\n✅ Found in invitations:`)
      console.log(`  ID: ${invitationDoc.id}`)
      console.log(`  Email: ${data.coachEmail || data.athleteEmail || 'N/A'}`)
      console.log(`  Name: ${data.coachName || data.athleteName || 'N/A'}`)
      console.log(`  Type: ${data.type || data.role || 'N/A'}`)
      console.log(`  Status: ${data.status || 'N/A'}`)
      console.log(`  Used: ${data.used ? 'Yes' : 'No'}`)
    } else {
      console.log(`❌ Not found in invitations collection`)
    }

    // Search for any invitations for lv255@cornell.edu
    console.log(`\n\n🔍 Searching for ALL invitations to lv255@cornell.edu...`)
    console.log('─'.repeat(80))

    const allInvitations = await db.collection('invitations').get()
    const coachIngestion = await db.collection('coach_ingestion').get()

    let found = false

    // Check invitations
    allInvitations.forEach(doc => {
      const data = doc.data()
      const email = data.coachEmail || data.athleteEmail || ''
      if (email.toLowerCase() === 'lv255@cornell.edu') {
        found = true
        console.log(`\n✅ Found in invitations collection:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  Email: ${email}`)
        console.log(`  Type: ${data.type || data.role || 'N/A'}`)
        console.log(`  Status: ${data.status}`)
        console.log(`  Used: ${data.used}`)
      }
    })

    // Check coach_ingestion
    coachIngestion.forEach(doc => {
      const data = doc.data()
      const email = data.coachEmail || ''
      if (email.toLowerCase() === 'lv255@cornell.edu') {
        found = true
        console.log(`\n✅ Found in coach_ingestion collection:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  Email: ${email}`)
        console.log(`  Status: ${data.status}`)
        console.log(`  Used: ${data.used}`)
      }
    })

    if (!found) {
      console.log(`\n❌ No invitations found for lv255@cornell.edu`)
      console.log(`\nThis means the old invitation was deleted successfully.`)
      console.log(`You need to create a NEW invitation for this email.`)
    }

    console.log('\n' + '='.repeat(80))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkCoachInvitation()
