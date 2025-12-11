/**
 * Delete ALL Invitations for Cornell User
 * Removes all coach and athlete invitations
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

async function deleteAllCornellInvitations() {
  try {
    const searchEmail = 'lv255@cornell.edu'

    console.log(`\n🗑️  Deleting ALL invitations for: ${searchEmail}`)
    console.log('=' .repeat(80))

    const allInvitations = await db.collection('invitations').get()

    const toDelete = []

    allInvitations.forEach(doc => {
      const data = doc.data()
      const email = data.coachEmail || data.athleteEmail || data.email || ''

      if (email.toLowerCase() === searchEmail.toLowerCase()) {
        toDelete.push({
          id: doc.id,
          email: email,
          type: data.type || data.role || 'unknown',
          status: data.status || 'unknown'
        })
      }
    })

    if (toDelete.length === 0) {
      console.log(`\n❌ No invitations found for ${searchEmail}`)
      return
    }

    console.log(`\n✅ Found ${toDelete.length} invitation(s) to delete:`)
    toDelete.forEach((inv, index) => {
      console.log(`\n  [${index + 1}] ${inv.id}`)
      console.log(`      Type: ${inv.type}`)
      console.log(`      Status: ${inv.status}`)
    })

    console.log(`\n\n⚠️  Deleting in 2 seconds...`)
    await new Promise(resolve => setTimeout(resolve, 2000))

    for (const inv of toDelete) {
      await db.collection('invitations').doc(inv.id).delete()
      console.log(`  ✅ Deleted: ${inv.id}`)
    }

    console.log(`\n\n${'='.repeat(80)}`)
    console.log(`✅ ALL INVITATIONS DELETED`)
    console.log(`\nYou can now send a fresh invitation to: ${searchEmail}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

deleteAllCornellInvitations()
