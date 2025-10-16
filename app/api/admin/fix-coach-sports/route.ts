import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Fix invalid sport values in creatorPublic collection
 * Maps invalid sports like "Coaching", "N/A" to valid values
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking creatorPublic collection for invalid sports...')

    // Valid sports from the contributors page
    const VALID_SPORTS = [
      'soccer', 'basketball', 'football', 'baseball', 'tennis', 'volleyball',
      'hockey', 'lacrosse', 'rugby', 'cricket', 'golf', 'swimming',
      'track', 'cross-country', 'wrestling', 'boxing', 'mma', 'other'
    ]

    // Mapping for common invalid values
    const SPORT_MAPPING: Record<string, string> = {
      'coaching': 'other',
      'n/a': 'other',
      'general': 'other',
      'brazilian jiu-jitsu': 'mma',
      'bjj': 'mma',
      'jiu-jitsu': 'mma'
    }

    const snapshot = await adminDb.collection('creatorPublic').get()
    console.log(`Found ${snapshot.size} documents in creatorPublic`)

    const results = []
    let fixed = 0
    let skipped = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const currentSport = (data.sport || '').toLowerCase().trim()

      const result: any = {
        id: doc.id,
        name: data.name,
        currentSport: data.sport,
        lowercaseSport: currentSport
      }

      // Check if sport is valid
      if (!VALID_SPORTS.includes(currentSport)) {
        // Try to map to a valid sport
        const mappedSport = SPORT_MAPPING[currentSport] || 'other'

        result.action = 'fixed'
        result.newSport = mappedSport

        await adminDb.collection('creatorPublic').doc(doc.id).update({
          sport: mappedSport,
          updatedAt: new Date()
        })

        console.log(`✅ Fixed ${data.name}: "${data.sport}" → "${mappedSport}"`)
        fixed++
      } else {
        result.action = 'skipped'
        result.reason = 'valid sport'
        skipped++
      }

      results.push(result)
    }

    console.log(`✅ Done! Fixed: ${fixed}, Skipped: ${skipped}`)

    return NextResponse.json({
      success: true,
      data: {
        total: snapshot.size,
        fixed,
        skipped,
        results
      }
    })

  } catch (error) {
    console.error('Fix coach sports error:', error)
    return NextResponse.json(
      { error: 'Failed to fix coach sports' },
      { status: 500 }
    )
  }
}

/**
 * Get current sport values in creatorPublic collection
 */
export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('creatorPublic').get()

    const coaches = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        sport: data.sport,
        verified: data.verified,
        featured: data.featured
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        total: snapshot.size,
        coaches
      }
    })

  } catch (error) {
    console.error('Get coaches error:', error)
    return NextResponse.json(
      { error: 'Failed to get coaches' },
      { status: 500 }
    )
  }
}
