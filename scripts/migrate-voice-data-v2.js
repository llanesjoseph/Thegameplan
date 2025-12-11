/**
 * MIGRATION V2 - Maps old voice capture field names to new structure
 * This properly transforms the voice data so the AI can read it
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

/**
 * Transform old voice capture structure to new structure
 */
function transformVoiceData(oldData) {
  const newData = {}

  // Map corePhilosophy -> coachingPhilosophy
  if (oldData.corePhilosophy) {
    newData.coachingPhilosophy = oldData.corePhilosophy
  } else if (oldData.philosophy?.coreBeliefs) {
    newData.coachingPhilosophy = oldData.philosophy.coreBeliefs.join(' ')
  }

  // Map communicationStyle
  if (oldData.voiceCharacteristics?.communicationStyle) {
    newData.communicationStyle = oldData.voiceCharacteristics.communicationStyle
  } else if (oldData.philosophy?.communicationPreferences) {
    newData.communicationStyle = oldData.philosophy.communicationPreferences
  }

  // Map motivationApproach
  if (oldData.philosophy?.motivationStyle) {
    newData.motivationApproach = oldData.philosophy.motivationStyle
  }

  // Map favoriteSayings / catchphrases -> catchphrases
  if (oldData.favoriteSayings && oldData.favoriteSayings.length > 0) {
    newData.catchphrases = oldData.favoriteSayings
  } else if (oldData.voiceCharacteristics?.catchphrases) {
    newData.catchphrases = oldData.voiceCharacteristics.catchphrases
  } else if (oldData.personality?.catchphrases) {
    newData.catchphrases = oldData.personality.catchphrases
  } else {
    newData.catchphrases = []
  }

  // Map stories -> keyStories
  if (oldData.stories && oldData.stories.length > 0) {
    newData.keyStories = oldData.stories.map(s => {
      if (typeof s === 'string') return s
      return `${s.title || 'Story'}: ${s.story || s.lesson || JSON.stringify(s)}`
    })
  } else if (oldData.storyBank) {
    newData.keyStories = []
    if (oldData.storyBank.teachingMoments) newData.keyStories.push(...oldData.storyBank.teachingMoments)
    if (oldData.storyBank.inspirationalStories) newData.keyStories.push(...oldData.storyBank.inspirationalStories)
    if (oldData.storyBank.funnyStories) newData.keyStories.push(...oldData.storyBank.funnyStories)
  } else {
    newData.keyStories = []
  }

  // Map personality traits
  if (oldData.personality?.traits) {
    newData.personalityTraits = oldData.personality.traits
  } else if (oldData.personality?.tone) {
    newData.personalityTraits = [oldData.personality.tone]
  } else {
    newData.personalityTraits = []
  }

  // Map currentContext
  if (oldData.currentTeam) {
    newData.currentContext = oldData.currentTeam
  } else if (oldData.currentContext?.currentTeam) {
    newData.currentContext = oldData.currentContext.currentTeam
  }

  // Map technicalFocus
  if (oldData.technicalFocus && Array.isArray(oldData.technicalFocus)) {
    newData.technicalFocus = oldData.technicalFocus.map(t => {
      if (typeof t === 'string') return t
      return `${t.area || 'Focus'}: ${t.description || JSON.stringify(t)}`
    }).join(' | ')
  } else if (oldData.technicalKnowledge?.technicalPhilosophy) {
    newData.technicalFocus = oldData.technicalKnowledge.technicalPhilosophy
  }

  // Keep captureMode
  newData.captureMode = oldData.captureMode || 'detailed'

  return newData
}

async function migrateVoiceData() {
  console.log('🔄 Starting voice data migration V2 (with field mapping)...\n')

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

        // Transform the voice data to new structure
        const oldVoiceData = profileData.voiceCaptureData
        const newVoiceData = transformVoiceData(oldVoiceData)

        console.log(`\n🔄 Transforming voice data for ${email}:`)
        console.log(`   - coachingPhilosophy: ${newVoiceData.coachingPhilosophy ? '✓' : '✗'}`)
        console.log(`   - catchphrases: ${newVoiceData.catchphrases?.length || 0} phrases`)
        console.log(`   - keyStories: ${newVoiceData.keyStories?.length || 0} stories`)
        console.log(`   - personalityTraits: ${newVoiceData.personalityTraits?.length || 0} traits`)

        // Copy transformed voice data to users collection
        await db.collection('users').doc(uid).update({
          voiceCaptureData: newVoiceData,
          voiceCaptureCompleteness: newVoiceData.captureMode || 'detailed',
          voiceDataMigrated: true,
          voiceDataMigratedAt: new Date(),
          voiceDataVersion: 2
        })

        console.log(`✅ MIGRATED: ${email}`)
        migratedCount++

      } catch (error) {
        console.error(`❌ ERROR: ${email} - ${error.message}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Migration V2 Complete!\n')
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
