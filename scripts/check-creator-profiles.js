/**
 * Check voice data in creator_profiles collection
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

async function checkCreatorProfiles() {
  console.log('🔍 Checking voice data in creator_profiles collection...\n')

  const coaches = [
    { email: 'crucibletester1@gmail.com', uid: 'vfEzchS1EVbsu73U1u8XRXwKBSW2' },
    { email: 'crucibletester4@proton.me', uid: 'b3nQAV1w1NhxutEGiN53NiJ9Yw73' }
  ]

  for (const coach of coaches) {
    console.log('='.repeat(60))
    console.log(`📧 ${coach.email}`)
    console.log('='.repeat(60))

    const profileDoc = await db.collection('creator_profiles').doc(coach.uid).get()

    if (!profileDoc.exists) {
      console.log('❌ No creator_profile found\n')
      continue
    }

    const profileData = profileDoc.data()

    console.log(`✅ Found creator_profile`)
    console.log(`   Name: ${profileData.displayName}`)

    if (profileData.voiceCaptureData) {
      console.log('\n✅ HAS voiceCaptureData in creator_profiles:')
      const vcData = profileData.voiceCaptureData

      // Show ALL fields
      console.log(JSON.stringify(vcData, null, 2))
    } else {
      console.log('\n❌ NO voiceCaptureData in creator_profiles')
    }

    console.log('\n')
  }
}

checkCreatorProfiles()
  .then(() => {
    console.log('✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
