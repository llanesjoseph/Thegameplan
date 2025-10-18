/**
 * Check what voice data exists for coaches in the database
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

// Manually load .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+?)[=:](.*)/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnv()

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'gameplan-787a2'
    })
  }
}

const db = admin.firestore()

async function checkVoiceData() {
  console.log('🔍 Checking voice data in users collection...\n')

  const coaches = [
    'crucibletester1@gmail.com',
    'crucibletester4@proton.me',
    'llanes.joseph.m@gmail.com'
  ]

  for (const email of coaches) {
    console.log('=' .repeat(60))
    console.log(`📧 ${email}`)
    console.log('=' .repeat(60))

    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.log('❌ User not found in users collection\n')
      continue
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    console.log(`✅ Found user: ${userDoc.id}`)
    console.log(`   Role: ${userData.role}`)
    console.log(`   Name: ${userData.displayName}`)

    if (userData.voiceCaptureData) {
      console.log('\n✅ HAS voiceCaptureData:')
      const vcData = userData.voiceCaptureData

      console.log(`   - coachingPhilosophy: ${vcData.coachingPhilosophy ? '✓' : '✗'}`)
      if (vcData.coachingPhilosophy) {
        console.log(`     "${vcData.coachingPhilosophy.substring(0, 100)}..."`)
      }

      console.log(`   - communicationStyle: ${vcData.communicationStyle || 'none'}`)
      console.log(`   - motivationApproach: ${vcData.motivationApproach ? '✓' : '✗'}`)

      if (vcData.catchphrases && vcData.catchphrases.length > 0) {
        console.log(`   - catchphrases: ${vcData.catchphrases.length} phrases`)
        vcData.catchphrases.forEach((phrase, i) => {
          console.log(`     ${i + 1}. "${phrase}"`)
        })
      } else {
        console.log(`   - catchphrases: none`)
      }

      if (vcData.keyStories && vcData.keyStories.length > 0) {
        console.log(`   - keyStories: ${vcData.keyStories.length} stories`)
      } else {
        console.log(`   - keyStories: none`)
      }

      if (vcData.personalityTraits && vcData.personalityTraits.length > 0) {
        console.log(`   - personalityTraits: ${vcData.personalityTraits.join(', ')}`)
      }

      console.log(`   - voiceCaptureCompleteness: ${userData.voiceCaptureCompleteness || 'unknown'}`)
    } else {
      console.log('\n❌ NO voiceCaptureData found')
    }

    console.log('\n')
  }
}

checkVoiceData()
  .then(() => {
    console.log('✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
