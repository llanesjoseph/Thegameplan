import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { generateSlug } from '@/lib/slug-utils'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * MIGRATE ATHLETE SLUGS
 * Creates slug mappings for all existing athletes that don't have one
 * This is a one-time migration to backfill slugs for athletes created before slug system was implemented
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get the user's role to ensure they're an admin
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      )
    }

    console.log('🔄 [MIGRATE-SLUGS] Starting athlete slug migration...')

    // Get all users with role 'athlete'
    const athletesSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .get()

    console.log(`📊 [MIGRATE-SLUGS] Found ${athletesSnapshot.size} athletes to process`)

    const results = {
      total: athletesSnapshot.size,
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const athleteDoc of athletesSnapshot.docs) {
      const athleteData = athleteDoc.data()
      const athleteUid = athleteDoc.id
      const displayName = `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim()
        || athleteData.displayName
        || athleteData.email?.split('@')[0]
        || 'Athlete'

      try {
        // Check if slug already exists for this athlete
        const existingSlugQuery = await adminDb
          .collection('slug_mappings')
          .where('targetId', '==', athleteUid)
          .limit(1)
          .get()

        if (!existingSlugQuery.empty) {
          console.log(`⏭️ [MIGRATE-SLUGS] Slug already exists for ${displayName}`)
          results.skipped++
          continue
        }

        // Generate new slug
        const slug = generateSlug(displayName, athleteUid)

        // Create slug mapping
        await adminDb.collection('slug_mappings').doc(slug).set({
          slug,
          targetId: athleteUid,
          displayName,
          entityType: 'athlete',
          createdAt: new Date(),
          lastUsed: new Date()
        })

        console.log(`✅ [MIGRATE-SLUGS] Created slug for ${displayName}: ${slug}`)
        results.created++
      } catch (error: any) {
        const errorMsg = `Failed to create slug for ${displayName}: ${error.message}`
        console.error(`❌ [MIGRATE-SLUGS] ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    console.log(`✅ [MIGRATE-SLUGS] Migration complete:`, results)

    return NextResponse.json({
      success: true,
      message: 'Athlete slug migration completed',
      results
    })

  } catch (error: any) {
    console.error('❌ [MIGRATE-SLUGS] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to migrate athlete slugs' },
      { status: 500 }
    )
  }
}
