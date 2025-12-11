/**
 * ONE-TIME MIGRATION SCRIPT
 * Run this with: node scripts/migrate-voice-data.js
 *
 * Copies voiceCaptureData from creator_profiles to users collection
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
    console.log('📄 Loaded environment variables from .env.local')
  } else {
    console.log('⚠️  .env.local not found, using existing environment variables')
  }
}

loadEnv()

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'gameplan-787a2'
      })
      console.log('✅ Firebase Admin initialized with service account from env')
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'gameplan-787a2',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        projectId: 'gameplan-787a2'
      })
      console.log('✅ Firebase Admin initialized with individual env credentials')
    } else {
      throw new Error('No Firebase credentials found in environment variables')
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message)
    console.error('\nMake sure .env.local contains FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL')
    process.exit(1)
  }
}

const db = admin.firestore()

async function migrateVoiceData() {
  console.log('🔄 Starting voice data migration...\n')

  try {
    // Get all creator profiles with voiceCaptureData
    const profilesSnapshot = await db
      .collection('creator_profiles')
      .where('voiceCaptureData', '!=', null)
      .get()

    if (profilesSnapshot.empty) {
      console.log('✅ No profiles with voice data found')
      return
    }

    console.log(`📊 Found ${profilesSnapshot.size} profiles with voice data\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data()
      const uid = profileDoc.id
      const email = profileData.email || 'unknown'

      try {
        // Get user document
        const userDoc = await db.collection('users').doc(uid).get()

        if (!userDoc.exists) {
          console.log(`⚠️  SKIPPED: ${email} - User document not found`)
          skippedCount++
          continue
        }

        const userData = userDoc.data()

        // Check if voice data already exists
        if (userData?.voiceCaptureData) {
          console.log(`⏭️  SKIPPED: ${email} - Already has voice data`)
          skippedCount++
          continue
        }

        // Copy voice data
        await db.collection('users').doc(uid).update({
          voiceCaptureData: profileData.voiceCaptureData,
          voiceCaptureCompleteness: profileData.voiceCaptureCompleteness || 'none',
          voiceDataMigrated: true,
          voiceDataMigratedAt: new Date()
        })

        console.log(`✅ MIGRATED: ${email}`)
        migratedCount++

      } catch (error) {
        console.error(`❌ ERROR: ${email} - ${error.message}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Migration Complete!\n')
    console.log(`   Total Profiles: ${profilesSnapshot.size}`)
    console.log(`   ✅ Migrated:    ${migratedCount}`)
    console.log(`   ⏭️  Skipped:     ${skippedCount}`)
    console.log(`   ❌ Errors:      ${errorCount}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateVoiceData()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
