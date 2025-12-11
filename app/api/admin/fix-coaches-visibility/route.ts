import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * AGGRESSIVE FIX: Set all coaches to verified and visible
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 AGGRESSIVE FIX: Setting all coaches to verified...')

    const snapshot = await adminDb.collection('creatorPublic').get()
    console.log(`Found ${snapshot.size} coaches in creatorPublic`)

    let updated = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Skip the hardcoded Jasmine Aikey
      if (doc.id === 'jasmine-aikey') {
        console.log(`⏭️  Skipping hardcoded coach: ${data.name}`)
        continue
      }

      console.log(`✅ Updating ${data.name} to verified=true`)

      await adminDb.collection('creatorPublic').doc(doc.id).update({
        verified: true,
        featured: false,
        updatedAt: new Date()
      })

      updated++
    }

    console.log(`✅ Done! Updated ${updated} coaches to verified`)

    return NextResponse.json({
      success: true,
      data: {
        total: snapshot.size,
        updated,
        message: `Set ${updated} coaches to verified=true`
      }
    })

  } catch (error) {
    console.error('Fix coaches visibility error:', error)
    return NextResponse.json(
      { error: 'Failed to fix coaches visibility' },
      { status: 500 }
    )
  }
}
