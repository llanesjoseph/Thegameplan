import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { getOriginalIdFromSlug } from '@/lib/slug-utils'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const { creatorId } = params

    // SECURITY: Resolve slug to original ID to prevent ID exposure
    let originalId = creatorId
    let coachProfile = null

    // First, try to resolve slug to original ID
    const slugResult = await getOriginalIdFromSlug(creatorId)
    if (slugResult.success && slugResult.originalId) {
      originalId = slugResult.originalId
      console.log(`[Coach Profile API] Resolved slug ${creatorId} to original ID: ${originalId}`)
    } else {
      console.log(`[Coach Profile API] No slug mapping found for ${creatorId}, treating as original ID`)
    }

    // Try to find coach profile by resolved original ID
    const coachProfileDoc = await db.collection('creator_profiles').doc(originalId).get()
    if (coachProfileDoc.exists) {
      coachProfile = coachProfileDoc.data()
    } else {
      // Try to find in creators_index (where the contributors page queries from)
      const creatorIndexDoc = await db.collection('creators_index').doc(originalId).get()
      if (creatorIndexDoc.exists) {
        // Found in creators_index, now get the full profile from creator_profiles
        const fullProfile = await db.collection('creator_profiles').doc(originalId).get()
        if (fullProfile.exists) {
          coachProfile = fullProfile.data()
        } else {
          // Use the basic data from creators_index if full profile doesn't exist
          coachProfile = creatorIndexDoc.data()
        }
      } else {
        // Fallback: Try to find by slug in creator_profiles
        const coachQuery = await db.collection('creator_profiles')
          .where('slug', '==', creatorId)
          .limit(1)
          .get()

        if (!coachQuery.empty) {
          coachProfile = coachQuery.docs[0].data()
        }
      }
    }

    // If no coach profile found, return 404 error
    if (!coachProfile) {
      return NextResponse.json(
        { error: 'Coach not found', success: false },
        { status: 404 }
      )
    }

    // Debug logging for action photos (SECURITY: No ID exposure)
    console.log(`[Coach Profile API] Fetching coach profile via slug: ${creatorId}`)
    console.log(`[Coach Profile API] Action photos in profile:`, coachProfile.actionPhotos)
    console.log(`[Coach Profile API] Action photos type:`, typeof coachProfile.actionPhotos)
    console.log(`[Coach Profile API] Action photos is array:`, Array.isArray(coachProfile.actionPhotos))

    // Ensure action photos array has at least 3 photos for display
    const actionPhotos = coachProfile.actionPhotos && Array.isArray(coachProfile.actionPhotos) && coachProfile.actionPhotos.length > 0
      ? coachProfile.actionPhotos
      : []

    // Pad with placeholders if needed to ensure 3 photos minimum
    const paddedActionPhotos = [
      actionPhotos[0] || '/api/placeholder/800/600',
      actionPhotos[1] || '/api/placeholder/800/600',
      actionPhotos[2] || '/api/placeholder/800/600'
    ]

    // Transform coach profile to creator format
    const creatorData = {
      id: coachProfile.uid || creatorId,
      name: coachProfile.displayName?.toUpperCase() || `${coachProfile.firstName?.toUpperCase()} ${coachProfile.lastName?.toUpperCase()}`,
      firstName: coachProfile.firstName || 'Coach',
      lastName: coachProfile.lastName || '',
      sport: coachProfile.sport || 'Sports',
      tagline: coachProfile.tagline || 'Professional coach and athlete',
      credentials: coachProfile.credentials || 'Certified Coach',
      description: coachProfile.bio || 'I can help you with training, technique, and mental preparation.',
      heroImageUrl: coachProfile.heroImageUrl || '/api/placeholder/800/400',
      headshotUrl: coachProfile.headshotUrl || '/api/placeholder/200/200',
      actionPhotos: paddedActionPhotos,
      highlightVideo: coachProfile.highlightVideo || undefined,
      socialLinks: {
        facebook: undefined,
        twitter: undefined,
        instagram: undefined,
        linkedin: undefined
      },
      trainingLibrary: [
        {
          id: '1',
          title: `${coachProfile.sport} Training Fundamentals`,
          status: 'Available',
          thumbnail: '/api/placeholder/120/80'
        }
      ],
      profileCompleteness: coachProfile.profileCompleteness || 0,
      specialties: coachProfile.specialties || [],
      achievements: coachProfile.achievements || []
    }

    return NextResponse.json({
      success: true,
      data: creatorData
    })

  } catch (error) {
    console.error('Error fetching creator data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator data' },
      { status: 500 }
    )
  }
}