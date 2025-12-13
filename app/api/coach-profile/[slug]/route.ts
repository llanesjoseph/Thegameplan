import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { getOriginalIdFromSlug } from '@/lib/slug-utils'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const extractGalleryPhotos = (...sources: any[]): string[] => {
  const flatten = (value: any): string[] => {
    if (!value) return []
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.flatMap(flatten)
    if (typeof value === 'object') {
      const direct = value.url || value.imageUrl || value.src || value.path || value.photoURL || value.downloadURL
      if (typeof direct === 'string') {
        return [direct]
      }
      return Object.values(value).flatMap(flatten)
    }
    return []
  }

  const urls = sources.flatMap(flatten).map((url) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean)
  return Array.from(new Set(urls))
}

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

    // STRICT: Only use galleryPhotos from creator_profiles - these are photos uploaded by the coach
    // Do NOT merge from other sources (actionPhotos, mediaGallery, etc.) to prevent hard-coded images
    const galleryPhotos = Array.isArray(creatorData.galleryPhotos) 
      ? creatorData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      : []

    // Build coach profile response
    const bioValue = creatorData.bio ||
        creatorData.longBio ||
        creatorData.description ||
        userData.bio ||
        userData.about ||
        ''
    
    // DEBUG: Log bio sources for troubleshooting
    console.log(`[Coach Profile API] Bio sources for ${originalId}:`, {
      'creatorData.bio': creatorData.bio || 'MISSING',
      'creatorData.longBio': creatorData.longBio || 'MISSING',
      'creatorData.description': creatorData.description || 'MISSING',
      'userData.bio': userData.bio || 'MISSING',
      'userData.about': userData.about || 'MISSING',
      'finalBio': bioValue || 'EMPTY'
    })
    
    const coachProfile = {
      uid: originalId,
      displayName: creatorData.displayName || userData.displayName || 'Unknown Coach',
      email: userData.email || '',
      bio: bioValue,
      sport: creatorData.sport || 'General',
      yearsExperience: creatorData.experience || '0',
      specialties: creatorData.specialties || [],
      certifications: creatorData.credentials ? [creatorData.credentials] : [], // Legacy field, now called "milestones" in UI
      achievements: creatorData.achievements || [],
      profileImageUrl: profileImageUrl,
      coverImageUrl: coverImageUrl,
      bannerUrl: coverImageUrl, // Also set bannerUrl for compatibility
      showcasePhoto1: creatorData.showcasePhoto1 || userData.showcasePhoto1 || '',
      showcasePhoto2: creatorData.showcasePhoto2 || userData.showcasePhoto2 || '',
      galleryPhotos,
      // IRONCLAD: Social media links - MUST match EXACTLY what coach enters in their profile
      // Read from creators_index first (most up-to-date), then fallback to userData
      instagram: creatorData.instagram || creatorData.socialLinks?.instagram || userData.instagram || '',
      youtube: creatorData.youtube || creatorData.socialLinks?.youtube || userData.youtube || '',
      linkedin: creatorData.linkedin || creatorData.socialLinks?.linkedin || userData.linkedin || '',
      facebook: creatorData.facebook || creatorData.socialLinks?.facebook || userData.facebook || '',
      twitter: creatorData.twitter || creatorData.socialLinks?.twitter || userData.twitter || '',
      website: creatorData.website || userData.website || '',
      websiteUrl: creatorData.websiteUrl || userData.websiteUrl || '',
      location: creatorData.location || userData.location || '',
      title: creatorData.title || '',
      // IRONCLAD: socialLinks object MUST mirror individual fields exactly
      // This ensures Browse Coaches modal shows EXACTLY what coach set in their profile
      socialLinks: {
        instagram: creatorData.instagram || creatorData.socialLinks?.instagram || userData.instagram || '',
        linkedin: creatorData.linkedin || creatorData.socialLinks?.linkedin || userData.linkedin || '',
        twitter: creatorData.twitter || creatorData.socialLinks?.twitter || userData.twitter || '',
        facebook: creatorData.facebook || creatorData.socialLinks?.facebook || userData.facebook || '',
        youtube: creatorData.youtube || creatorData.socialLinks?.youtube || userData.youtube || ''
      },
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
