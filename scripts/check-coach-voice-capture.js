/**
 * Check Coach Voice Capture/Persona
 *
 * This script checks if a coach has a voice capture profile set up.
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

async function checkCoachVoiceCapture() {
  try {
    const coachId = 'vfEzchS1EVbsu73U1u8XRXwKBSW2' // Crucible1
    console.log(`🔍 Checking voice capture for coach: ${coachId}\n`)

    // Check users collection
    const userDoc = await db.collection('users').doc(coachId).get()
    if (!userDoc.exists) {
      console.log('❌ Coach not found in users collection')
      return
    }

    const userData = userDoc.data()
    console.log('=' .repeat(80))
    console.log('USER DOCUMENT')
    console.log('=' .repeat(80))
    console.log(`Email: ${userData.email}`)
    console.log(`Display Name: ${userData.displayName}`)
    console.log(`Role: ${userData.role}`)
    console.log(`\nVoice Capture Fields:`)
    console.log(`  voiceCapture: ${userData.voiceCapture || 'NOT SET'}`)
    console.log(`  voiceProfile: ${userData.voiceProfile || 'NOT SET'}`)
    console.log(`  coachingPersona: ${userData.coachingPersona || 'NOT SET'}`)
    console.log(`  aiPersona: ${userData.aiPersona || 'NOT SET'}`)

    // Check creator_profiles collection
    console.log('\n' + '='.repeat(80))
    console.log('CREATOR PROFILE')
    console.log('=' .repeat(80))

    const creatorProfilesSnapshot = await db.collection('creator_profiles')
      .where('uid', '==', coachId)
      .limit(1)
      .get()

    if (creatorProfilesSnapshot.empty) {
      console.log('❌ No creator profile found')
    } else {
      const creatorDoc = creatorProfilesSnapshot.docs[0]
      const creatorData = creatorDoc.data()
      console.log(`Profile ID: ${creatorDoc.id}`)
      console.log(`\nVoice Capture Fields:`)
      console.log(`  voiceCapture: ${creatorData.voiceCapture || 'NOT SET'}`)
      console.log(`  voiceProfile: ${creatorData.voiceProfile || 'NOT SET'}`)
      console.log(`  coachingPersona: ${creatorData.coachingPersona || 'NOT SET'}`)
      console.log(`  aiPersona: ${creatorData.aiPersona || 'NOT SET'}`)
      console.log(`  bio: ${creatorData.bio || 'NOT SET'}`)
      console.log(`  coachingStyle: ${creatorData.coachingStyle || 'NOT SET'}`)

      if (creatorData.voiceCapture) {
        console.log(`\n📝 Voice Capture Content:`)
        console.log(creatorData.voiceCapture)
      }

      if (creatorData.coachingPersona) {
        console.log(`\n🎭 Coaching Persona:`)
        console.log(creatorData.coachingPersona)
      }
    }

    // Check voice_captures collection
    console.log('\n' + '='.repeat(80))
    console.log('VOICE CAPTURES COLLECTION')
    console.log('=' .repeat(80))

    const voiceCapturesSnapshot = await db.collection('voice_captures')
      .where('coachId', '==', coachId)
      .get()

    if (voiceCapturesSnapshot.empty) {
      console.log('❌ No voice captures found')
    } else {
      console.log(`Found ${voiceCapturesSnapshot.docs.length} voice capture(s):\n`)
      voiceCapturesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`Voice Capture ${index + 1}:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  Created: ${data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}`)
        console.log(`  Persona: ${data.persona || 'NOT SET'}`)
        console.log(`  Voice Profile: ${data.voiceProfile || 'NOT SET'}`)
        if (data.persona) {
          console.log(`\n  📝 Persona Content:`)
          console.log(`  ${data.persona.substring(0, 200)}...`)
        }
        console.log('')
      })
    }

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

// Run the check
checkCoachVoiceCapture()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
