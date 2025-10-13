import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

/**
 * Automated Coach Count Update
 *
 * This cron job runs regularly to count active coaches and cache the result.
 *
 * ACTIVE COACH CRITERIA:
 * 1. isActive === true (coach is ready to coach)
 * 2. profileComplete === true (has completed their profile)
 * 3. status === 'approved' (application has been approved)
 * 4. Has at least one of: tagline, bio, or specialties
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔢 Starting automated coach count update...')

    // Query creators_index for active coaches
    const snapshot = await adminDb
      .collection('creators_index')
      .where('isActive', '==', true)
      .get()

    // Filter coaches based on our active criteria
    const activeCoaches = snapshot.docs.filter(doc => {
      const data = doc.data()

      // Must have completed profile
      if (!data.profileComplete) return false

      // Must have status approved (if field exists)
      if (data.status && data.status !== 'approved') return false

      // Must have at least some content
      const hasContent = Boolean(
        data.tagline ||
        data.bio ||
        (data.specialties && data.specialties.length > 0)
      )

      return hasContent
    })

    const activeCount = activeCoaches.length
    const totalCount = snapshot.size

    // Store the count in a dedicated cache collection
    await adminDb.collection('system_cache').doc('coach_count').set({
      activeCoaches: activeCount,
      totalCoaches: totalCount,
      lastUpdated: new Date(),
      criteria: {
        description: 'Active coaches with completed profiles and content',
        rules: [
          'isActive === true',
          'profileComplete === true',
          'status === approved',
          'Has tagline, bio, or specialties'
        ]
      }
    })

    console.log(`✅ Coach count updated: ${activeCount} active coaches (${totalCount} total)`)

    return NextResponse.json({
      success: true,
      data: {
        activeCoaches: activeCount,
        totalCoaches: totalCount,
        timestamp: new Date().toISOString()
      },
      message: `Successfully counted ${activeCount} active coaches`
    })

  } catch (error) {
    console.error('❌ Error updating coach count:', error)
    return NextResponse.json(
      { error: 'Failed to update coach count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
