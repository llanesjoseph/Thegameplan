import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { getOriginalIdFromSlug } from '@/lib/slug-utils'

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
    const slugResult = await getOriginalIdFromSlug(slug)
    
    if (!slugResult.success || !slugResult.originalId) {
      return NextResponse.json(
        { error: 'Coach not found', success: false },
        { status: 404 }
      )
    }

    const originalId = slugResult.originalId
    console.log(`[Coach Profile API] Resolved slug ${slug} to original ID`)

    // Get coach user data
    const userSnap = await db.collection('users').doc(originalId).get()

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'Coach not found', success: false },
        { status: 404 }
      )
    }

    const userData = userSnap.data()

    if (!userData) {
      return NextResponse.json(
        { error: 'Coach data not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is actually a coach (includes legacy 'creator' role)
    const validCoachRoles = ['coach', 'creator', 'assistant_coach']
    if (!validCoachRoles.includes(userData.role)) {
      return NextResponse.json(
        { error: 'This user is not a coach', success: false },
        { status: 404 }
      )
    }

    // Get coach profile from creators_index
    const creatorIndexDoc = await db.collection('creators_index').doc(originalId).get()
    
    if (!creatorIndexDoc.exists) {
      return NextResponse.json(
        { error: 'Coach profile not found', success: false },
        { status: 404 }
      )
    }

    const creatorData = creatorIndexDoc.data()

    if (!creatorData) {
      return NextResponse.json(
        { error: 'Coach profile data not found', success: false },
        { status: 404 }
      )
    }

    // Check all possible image field names
    // Prioritize Firebase Storage URLs over external URLs (Google Photos) for reliability
    const profileImageUrl = creatorData.headshotUrl ||
                           creatorData.photoURL ||
                           userData.photoURL ||
                           creatorData.profileImageUrl ||
                           userData.profileImage ||
                           ''

    const coverImageUrl = creatorData.heroImageUrl ||
                         creatorData.coverImageUrl ||
                         creatorData.bannerUrl ||
                         ''

    // Build coach profile response
    const coachProfile = {
      uid: originalId,
      displayName: creatorData.displayName || userData.displayName || 'Unknown Coach',
      email: userData.email || '',
      bio: creatorData.bio || '',
      sport: creatorData.sport || 'General',
      yearsExperience: creatorData.experience || '0',
      specialties: creatorData.specialties || [],
      certifications: creatorData.credentials ? [creatorData.credentials] : [],
      achievements: creatorData.achievements || [],
      profileImageUrl: profileImageUrl,
      coverImageUrl: coverImageUrl,
      bannerUrl: coverImageUrl, // Also set bannerUrl for compatibility
      socialLinks: {},
      verified: creatorData.verified || false,
      featured: creatorData.featured || false,
      isActive: creatorData.isActive || false,
      profileComplete: creatorData.profileComplete || false,
      status: creatorData.status || 'pending',
      tagline: creatorData.tagline || '',
      slug: slug // Return the slug for frontend use
    }

    return NextResponse.json({
      success: true,
      data: coachProfile
    })

  } catch (error) {
    console.error('Error fetching coach profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach profile' },
      { status: 500 }
    )
  }
}
