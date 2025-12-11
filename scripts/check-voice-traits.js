/**
 * Check Voice Traits in Users Collection
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function checkVoiceTraits() {
  try {
    const coachId = 'vfEzchS1EVbsu73U1u8XRXwKBSW2' // Crucible1
    console.log(`🔍 Checking voice traits for coach: ${'[COACH_ID]')

    const userDoc = await db.collection('users').doc(coachId).get()
    const userData = userDoc.data()

    console.log('voiceTraits field:', userData.voiceTraits)
    console.log('')

    if (userData.voiceTraits && Array.isArray(userData.voiceTraits)) {
      console.log('✅ Voice Traits Found:')
      userData.voiceTraits.forEach((trait, index) => {
        console.log(`   ${index + 1}. ${trait}`)
      })
    } else {
      console.log('❌ No voice traits found')
    }

  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

checkVoiceTraits()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
