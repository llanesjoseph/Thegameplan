/**
 * Find and Delete Cornell User (lv255@cornell.edu)
 * Searches for the user and provides option to delete
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
const auth = admin.auth()

async function findAndDeleteCornellUser() {
  try {
    const searchEmail = 'lv255@cornell.edu'

    console.log(`\n🔍 Searching for user: ${searchEmail}`)
    console.log('=' .repeat(80))

    // Search in Firestore users collection
    console.log('\n📊 Searching in Firestore users collection...')
    const usersSnapshot = await db.collection('users')
      .where('email', '==', searchEmail)
      .get()

    let firestoreUserDoc = null
    if (!usersSnapshot.empty) {
      firestoreUserDoc = usersSnapshot.docs[0]
      const userData = firestoreUserDoc.data()
      console.log(`\n✅ Found in Firestore users collection:`)
      console.log(`  Document ID (UID): ${firestoreUserDoc.id}`)
      console.log(`  Email: ${userData.email}`)
      console.log(`  Display Name: ${userData.displayName || 'N/A'}`)
      console.log(`  Role: ${userData.role}`)
      console.log(`  Created At: ${userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : 'N/A'}`)
    } else {
      console.log(`❌ Not found in Firestore users collection`)
    }

    // Search in Firebase Auth
    console.log(`\n🔐 Searching in Firebase Authentication...`)
    let authUser = null
    try {
      authUser = await auth.getUserByEmail(searchEmail)
      console.log(`\n✅ Found in Firebase Auth:`)
      console.log(`  UID: ${authUser.uid}`)
      console.log(`  Email: ${authUser.email}`)
      console.log(`  Display Name: ${authUser.displayName || 'N/A'}`)
      console.log(`  Email Verified: ${authUser.emailVerified}`)
      console.log(`  Created At: ${authUser.metadata.creationTime}`)
      console.log(`  Last Sign In: ${authUser.metadata.lastSignInTime || 'Never'}`)
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`❌ Not found in Firebase Auth`)
      } else {
        throw error
      }
    }

    // Search in invitations
    console.log(`\n📧 Searching in invitations collection...`)
    const invitationsSnapshot = await db.collection('invitations')
      .where('athleteEmail', '==', searchEmail)
      .get()

    const invitations = []
    if (!invitationsSnapshot.empty) {
      invitationsSnapshot.forEach(doc => {
        invitations.push({ id: doc.id, ...doc.data() })
      })
      console.log(`\n✅ Found ${invitations.length} invitation(s):`)
      invitations.forEach((inv, index) => {
        console.log(`\n  [${index + 1}] Invitation ID: ${inv.id}`)
        console.log(`      Status: ${inv.status}`)
        console.log(`      Used: ${inv.used ? 'Yes' : 'No'}`)
        console.log(`      Created: ${inv.createdAt?.toDate ? inv.createdAt.toDate().toISOString() : 'N/A'}`)
      })
    } else {
      console.log(`❌ No invitations found`)
    }

    // Search in athletes collection
    console.log(`\n🏃 Searching in athletes collection...`)
    const athletesSnapshot = await db.collection('athletes')
      .where('email', '==', searchEmail)
      .get()

    const athletes = []
    if (!athletesSnapshot.empty) {
      athletesSnapshot.forEach(doc => {
        athletes.push({ id: doc.id, ...doc.data() })
      })
      console.log(`\n✅ Found ${athletes.length} athlete document(s):`)
      athletes.forEach((athlete, index) => {
        console.log(`\n  [${index + 1}] Athlete ID: ${athlete.id}`)
        console.log(`      Display Name: ${athlete.displayName}`)
        console.log(`      Coach UID: ${athlete.creatorUid || 'N/A'}`)
      })
    } else {
      console.log(`❌ No athlete documents found`)
    }

    // Now offer to delete
    if (!firestoreUserDoc && !authUser && invitations.length === 0 && athletes.length === 0) {
      console.log(`\n\n⚠️ User not found in any collection`)
      console.log(`This means the user has been completely deleted or never existed.`)
      return
    }

    console.log(`\n\n${'='.repeat(80)}`)
    console.log(`🗑️  DELETION PLAN`)
    console.log('─'.repeat(80))

    if (authUser) {
      console.log(`✓ Delete from Firebase Authentication (UID: ${authUser.uid})`)
    }
    if (firestoreUserDoc) {
      console.log(`✓ Delete from Firestore users collection (UID: ${firestoreUserDoc.id})`)
    }
    if (invitations.length > 0) {
      console.log(`✓ Delete ${invitations.length} invitation(s)`)
    }
    if (athletes.length > 0) {
      console.log(`✓ Delete ${athletes.length} athlete document(s)`)
    }

    console.log(`\n⚠️  PROCEEDING WITH DELETION IN 3 SECONDS...`)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Delete from Firebase Auth
    if (authUser) {
      console.log(`\n🗑️  Deleting from Firebase Auth...`)
      await auth.deleteUser(authUser.uid)
      console.log(`✅ Deleted from Firebase Auth`)
    }

    // Delete from Firestore users
    if (firestoreUserDoc) {
      console.log(`\n🗑️  Deleting from Firestore users...`)
      await db.collection('users').doc(firestoreUserDoc.id).delete()
      console.log(`✅ Deleted from Firestore users`)
    }

    // Delete invitations
    if (invitations.length > 0) {
      console.log(`\n🗑️  Deleting ${invitations.length} invitation(s)...`)
      for (const inv of invitations) {
        await db.collection('invitations').doc(inv.id).delete()
        console.log(`  ✅ Deleted invitation: ${inv.id}`)
      }
    }

    // Delete athletes
    if (athletes.length > 0) {
      console.log(`\n🗑️  Deleting ${athletes.length} athlete document(s)...`)
      for (const athlete of athletes) {
        await db.collection('athletes').doc(athlete.id).delete()
        console.log(`  ✅ Deleted athlete: ${athlete.id}`)
      }
    }

    // Also check for alternative email formats (in case it was stored differently)
    console.log(`\n\n🔍 Checking for alternative email formats...`)
    const alternativeEmails = [
      'lv255@cornell',
      'LV255@cornell.edu',
      'LV255@CORNELL.EDU'
    ]

    for (const altEmail of alternativeEmails) {
      const altSnapshot = await db.collection('users').where('email', '==', altEmail).get()
      if (!altSnapshot.empty) {
        console.log(`\n⚠️  Found user with alternative email: ${altEmail}`)
        const altDoc = altSnapshot.docs[0]
        console.log(`   Deleting UID: ${altDoc.id}`)
        await db.collection('users').doc(altDoc.id).delete()

        // Try to delete from Auth too
        try {
          await auth.deleteUser(altDoc.id)
          console.log(`   ✅ Deleted from Auth`)
        } catch (err) {
          console.log(`   ⚠️  Not found in Auth or already deleted`)
        }
      }
    }

    console.log(`\n\n${'='.repeat(80)}`)
    console.log(`✅ DELETION COMPLETE`)
    console.log(`\nYou can now send a new invitation to: ${searchEmail}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

findAndDeleteCornellUser()
