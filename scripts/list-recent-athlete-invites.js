/**
 * List Recent Athlete Invitations
 * Shows all athlete invitations from the last 7 days
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

async function listRecentAthleteInvitations() {
  try {
    console.log(`\n🔍 Fetching all athlete invitations from last 7 days...`)
    console.log('=' .repeat(80))

    // Get all invitations
    const snapshot = await db.collection('invitations').get()

    console.log(`\n📊 Total invitations in database: ${snapshot.size}`)

    const athleteInvitations = []
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    snapshot.forEach(doc => {
      const data = doc.data()
      const role = data.role || data.type

      // Filter for athlete invitations
      if (role === 'athlete' || role === 'athlete_invitation') {
        // Check if created in last 7 days
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null
        if (createdAt && createdAt >= sevenDaysAgo) {
          athleteInvitations.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          })
        }
      }
    })

    console.log(`\n📧 Found ${athleteInvitations.length} athlete invitation(s) in last 7 days\n`)

    // Sort by creation date (most recent first)
    athleteInvitations.sort((a, b) => b.createdAt - a.createdAt)

    athleteInvitations.forEach((inv, index) => {
      console.log(`\n[${ index + 1}] INVITATION: ${inv.id}`)
      console.log('─'.repeat(80))
      console.log(`👤 Athlete: ${inv.athleteName}`)
      console.log(`📧 Email: ${inv.athleteEmail}`)
      console.log(`🏀 Sport: ${inv.sport}`)
      console.log(`📊 Status: ${inv.status}`)
      console.log(`🎯 Used: ${inv.used ? 'Yes' : 'No'}`)

      console.log(`\n👨‍🏫 COACH ASSIGNMENT:`)
      console.log(`  creatorUid (assigned coach): ${inv.creatorUid || '❌ NOT SET'}`)
      console.log(`  '[COACH_ID]'): ${inv.coachId || 'N/A'}`)
      console.log(`  coachName: ${inv.coachName || 'N/A'}`)

      console.log(`\n📝 METADATA:`)
      console.log(`  Created by (admin): ${inv.createdByName || 'Unknown'} (${inv.createdBy || 'N/A'})`)
      console.log(`  Created at: ${inv.createdAt.toISOString()}`)
      console.log(`  Expires at: ${inv.expiresAt?.toDate ? inv.expiresAt.toDate().toISOString() : 'N/A'}`)

      if (inv.used && inv.usedBy) {
        console.log(`  Used by (athlete UID): ${inv.usedBy}`)
        console.log(`  Used at: ${inv.usedAt?.toDate ? inv.usedAt.toDate().toISOString() : 'N/A'}`)
      }
    })

    // Also search for invitations matching the email the user mentioned (case-insensitive)
    console.log(`\n\n🔍 Searching specifically for "LonaLorraine.Vincent@gmail.com" (case-insensitive)...`)
    console.log('=' .repeat(80))

    const allInvitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const matchingEmail = allInvitations.filter(inv =>
      inv.athleteEmail && inv.athleteEmail.toLowerCase().includes('lona')
    )

    if (matchingEmail.length > 0) {
      console.log(`\n✅ Found ${matchingEmail.length} invitation(s) with "lona" in email:`)
      matchingEmail.forEach(inv => {
        console.log(`\n  ID: ${inv.id}`)
        console.log(`  Email: ${inv.athleteEmail}`)
        console.log(`  Name: ${inv.athleteName || 'N/A'}`)
        console.log(`  creatorUid: ${inv.creatorUid || '❌ NOT SET'}`)
        console.log(`  Status: ${inv.status}`)
      })
    } else {
      console.log('❌ No invitations found with "lona" in email')
    }

    // Search for coach "llanes.joseph.m"
    console.log(`\n\n🔍 Searching for coach "llanes.joseph.m"...`)
    console.log('=' .repeat(80))

    const coachesSnapshot = await db.collection('users')
      .where('role', '==', 'coach')
      .get()

    const matchingCoaches = []
    coachesSnapshot.forEach(doc => {
      const data = doc.data()
      const email = data.email || ''
      if (email.toLowerCase().includes('llanes') || email.toLowerCase().includes('joseph')) {
        matchingCoaches.push({
          uid: doc.id,
          ...data
        })
      }
    })

    if (matchingCoaches.length > 0) {
      console.log(`\n✅ Found ${matchingCoaches.length} coach(es) matching "llanes.joseph.m":`)
      matchingCoaches.forEach(coach => {
        console.log(`\n  UID: ${coach.uid}`)
        console.log(`  Name: ${coach.displayName}`)
        console.log(`  Email: ${coach.email}`)
        console.log(`  Role: ${coach.role}`)
        console.log(`  Sport: ${coach.sport || 'N/A'}`)
      })
    } else {
      console.log('❌ No coaches found matching "llanes.joseph.m"')
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Check complete')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

listRecentAthleteInvitations()
