// Script to fix invalid sport values in creatorPublic collection
// Run with: npx tsx scripts/fix-coach-sports.ts

import { adminDb } from '../lib/firebase.admin'
import { SPORTS } from '../lib/constants/sports'

// Valid sports (lowercased for comparison)
const VALID_SPORTS = SPORTS.map(s => s.toLowerCase())

// Mapping for common invalid values
const SPORT_MAPPING: Record<string, string> = {
  'coaching': 'other',
  'n/a': 'other',
  'general': 'other',
  'brazilian jiu-jitsu': 'mma',
  'bjj': 'mma'
}

async function fixCoachSports() {
  console.log('🔍 Checking creatorPublic collection...\n')

  const snapshot = await adminDb.collection('creatorPublic').get()
  console.log(`Found ${snapshot.size} documents in creatorPublic\n`)

  let fixed = 0
  let skipped = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const currentSport = (data.sport || '').toLowerCase()

    console.log(`\n📋 Coach: ${data.name}`)
    console.log(`   Current sport: "${data.sport}"`)
    console.log(`   Lowercase: "${currentSport}"`)

    // Check if sport is valid
    if (!VALID_SPORTS.includes(currentSport)) {
      // Try to map to a valid sport
      const mappedSport = SPORT_MAPPING[currentSport] || 'other'

      console.log(`   ⚠️  Invalid sport! Fixing to: "${mappedSport}"`)

      await adminDb.collection('creatorPublic').doc(doc.id).update({
        sport: mappedSport,
        updatedAt: new Date()
      })

      fixed++
    } else {
      console.log(`   ✅ Valid sport`)
      skipped++
    }
  }

  console.log(`\n\n✅ Done!`)
  console.log(`   Fixed: ${fixed}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${snapshot.size}`)
}

fixCoachSports()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
