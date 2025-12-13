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

    // IRONCLAD MIRROR: Read cover image from creators_index (synced immediately)
    const coverImageUrl = creatorData.heroImageUrl ||
                         creatorData.coverImageUrl ||
                         creatorData.bannerUrl ||
                         ''

    // IRONCLAD MIRROR: Read from creators_index FIRST (most up-to-date, synced immediately after coach saves)
    // This ensures Browse Coaches shows EXACTLY what coach entered in their profile
    const bioValue = creatorData.bio ||
        creatorData.description ||
        creatorData.longBio ||
        userData.bio ||
        userData.about ||
        ''
    
    // IRONCLAD MIRROR: Name from creators_index first (synced immediately)
    const displayNameValue = creatorData.displayName || 
                            creatorData.name || 
                            userData.displayName || 
                            'Unknown Coach'
    
    // IRONCLAD MIRROR: Photos from creators_index first (synced immediately)
    const profileImageUrlValue = creatorData.profileImageUrl ||
                                creatorData.headshotUrl ||
                                creatorData.photoURL ||
                                userData.photoURL ||
                                userData.profileImage ||
                                ''
    
    const showcasePhoto1Value = creatorData.showcasePhoto1 || userData.showcasePhoto1 || ''
    const showcasePhoto2Value = creatorData.showcasePhoto2 || userData.showcasePhoto2 || ''
    
    // IRONCLAD MIRROR: Gallery photos from creators_index (synced immediately, filtered to valid URLs only)
    const galleryPhotosValue = Array.isArray(creatorData.galleryPhotos) 
      ? creatorData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      : []
    
    // DEBUG: Log to verify we're reading from creators_index (the mirror)
    console.log(`[Coach Profile API] IRONCLAD MIRROR - Reading from creators_index for ${originalId}:`, {
      'displayName': displayNameValue,
      'bio': bioValue ? `${bioValue.substring(0, 50)}...` : 'EMPTY',
      'profileImageUrl': profileImageUrlValue ? 'SET' : 'MISSING',
      'showcasePhoto1': showcasePhoto1Value ? 'SET' : 'MISSING',
      'showcasePhoto2': showcasePhoto2Value ? 'SET' : 'MISSING',
      'galleryPhotos': `${galleryPhotosValue.length} photos`
    })
    
    const coachProfile = {
      uid: originalId,
      displayName: displayNameValue,
      email: userData.email || '',
      bio: bioValue,
      sport: creatorData.sport || 'General',
      yearsExperience: creatorData.experience || '0',
      specialties: creatorData.specialties || [],
      certifications: creatorData.credentials ? [creatorData.credentials] : [], // Legacy field, now called "milestones" in UI
      achievements: creatorData.achievements || [],
      profileImageUrl: profileImageUrlValue,
      coverImageUrl: coverImageUrl,
      bannerUrl: coverImageUrl, // Also set bannerUrl for compatibility
      showcasePhoto1: showcasePhoto1Value,
      showcasePhoto2: showcasePhoto2Value,
      galleryPhotos: galleryPhotosValue,
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
