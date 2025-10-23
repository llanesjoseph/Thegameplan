import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { getOriginalIdFromSecureSlug } from '@/lib/secure-slug-utils'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // SECURITY: Resolve slug to original ID to prevent ID exposure
    const slugResult = await getOriginalIdFromSecureSlug(slug)
    
    if (!slugResult.success || !slugResult.originalId) {
      return NextResponse.json(
        { error: 'Athlete not found', success: false },
        { status: 404 }
      )
    }

    const originalId = slugResult.originalId
    console.log(`[SECURE-ATHLETE-API] Resolved slug ${slug} to athlete ID`)

    // Get athlete data
    const athleteDoc = await db.collection('athletes').doc(originalId).get()
    
    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found', success: false },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()

    // Get user data for additional info
    const userDoc = await db.collection('users').doc(originalId).get()
    const userData = userDoc.exists ? userDoc.data() : {}

    // Build secure athlete response
    const athleteProfile = {
      uid: originalId,
      slug: slug, // Return the slug for frontend use
      displayName: athleteData.displayName || userData.displayName || 'Unknown Athlete',
      email: userData.email || '',
      sport: athleteData.sport || userData.sport || 'General',
      level: athleteData.level || userData.level || 'Beginner',
      coachId: athleteData.coachId || userData.coachId || '',
      assignedCoachId: athleteData.assignedCoachId || userData.assignedCoachId || '',
      profileImageUrl: athleteData.profileImageUrl || userData.photoURL || '',
      isActive: athleteData.isActive !== false,
      createdAt: athleteData.createdAt,
      lastUpdated: athleteData.lastUpdated
    }

    return NextResponse.json({
      success: true,
      data: athleteProfile
    })

  } catch (error) {
    console.error('Error fetching secure athlete profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch athlete profile' },
      { status: 500 }
    )
  }
}
