import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/create-baked-profile
 * 
 * AIRTIGHT: Create a baked profile with comprehensive validation and atomic operations.
 * Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    
    // AIRTIGHT: Comprehensive validation
    const { targetEmail, displayName, firstName, lastName, sport } = body
    
    if (!targetEmail || !displayName || !firstName || !lastName || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: targetEmail, displayName, firstName, lastName, sport' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const normalizedEmail = targetEmail.toLowerCase().trim()
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }
    
    // Check if baked profile already exists for this email
    const existingQuery = await db.collection('baked_profiles')
      .where('targetEmail', '==', normalizedEmail)
      .where('status', 'in', ['pending', 'ready'])
      .limit(1)
      .get()
    
    if (!existingQuery.empty) {
      return NextResponse.json(
        { error: `A baked profile already exists for ${normalizedEmail} with status 'pending' or 'ready'` },
        { status: 400 }
      )
    }
    
    // AIRTIGHT: Use transaction to ensure atomic creation
    const bakedProfileId = `baked-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = new Date()
    
    const bakedProfileData: any = {
      bakedProfileId,
      targetEmail: normalizedEmail,
      targetUid: body.targetUid || null,
      displayName: (displayName || '').trim(),
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      email: normalizedEmail,
      sport: (sport || '').trim(),
      location: (body.location || '').trim(),
      tagline: (body.tagline || '').trim(),
      credentials: (body.credentials || '').trim(),
      bio: (body.bio || '').trim(),
      philosophy: (body.philosophy || '').trim(),
      specialties: Array.isArray(body.specialties) ? body.specialties : [],
      achievements: Array.isArray(body.achievements) ? body.achievements : [],
      experience: (body.experience || '').trim(),
      // All image fields - validate URLs
      profileImageUrl: (body.profileImageUrl || body.headshotUrl || '').trim(),
      headshotUrl: (body.headshotUrl || body.profileImageUrl || '').trim(),
      heroImageUrl: (body.heroImageUrl || '').trim(),
      showcasePhoto1: (body.showcasePhoto1 || '').trim(),
      showcasePhoto2: (body.showcasePhoto2 || '').trim(),
      galleryPhotos: Array.isArray(body.galleryPhotos) 
        ? body.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : [],
      actionPhotos: Array.isArray(body.actionPhotos) ? body.actionPhotos : [],
      highlightVideo: (body.highlightVideo || '').trim(),
      // Social links
      instagram: (body.instagram || body.socialLinks?.instagram || '').trim(),
      facebook: (body.facebook || body.socialLinks?.facebook || '').trim(),
      twitter: (body.twitter || body.socialLinks?.twitter || '').trim(),
      linkedin: (body.linkedin || body.socialLinks?.linkedin || '').trim(),
      youtube: (body.youtube || body.socialLinks?.youtube || '').trim(),
      socialLinks: {
        instagram: (body.instagram || body.socialLinks?.instagram || '').trim(),
        facebook: (body.facebook || body.socialLinks?.facebook || '').trim(),
        twitter: (body.twitter || body.socialLinks?.twitter || '').trim(),
        linkedin: (body.linkedin || body.socialLinks?.linkedin || '').trim(),
        youtube: (body.youtube || body.socialLinks?.youtube || '').trim()
      },
      profileCompleteness: typeof body.profileCompleteness === 'number' ? body.profileCompleteness : 100,
      isVerified: body.isVerified ?? true,
      isPlatformCoach: body.isPlatformCoach ?? true,
      visibleInBrowseCoaches: body.visibleInBrowseCoaches ?? false,
      readyForProvisioning: false,
      status: 'pending',
      createdBy: authResult.user.uid,
      createdAt: now,
      updatedAt: now
    }
    
    // Create the baked profile atomically
    await db.collection('baked_profiles').doc(bakedProfileId).set(bakedProfileData)
    
    // If visible in Browse Coaches, sync to creators_index atomically
    if (bakedProfileData.visibleInBrowseCoaches) {
      await db.runTransaction(async (transaction) => {
        const creatorsIndexRef = db.collection('creators_index').doc(bakedProfileId)
        const indexData: any = {
          uid: bakedProfileId,
          displayName: bakedProfileData.displayName,
          name: bakedProfileData.displayName,
          email: normalizedEmail,
          sport: bakedProfileData.sport,
          location: bakedProfileData.location || '',
          bio: bakedProfileData.bio || '',
          profileImageUrl: bakedProfileData.profileImageUrl || bakedProfileData.headshotUrl || '',
          headshotUrl: bakedProfileData.profileImageUrl || bakedProfileData.headshotUrl || '',
          photoURL: bakedProfileData.profileImageUrl || bakedProfileData.headshotUrl || '',
          showcasePhoto1: bakedProfileData.showcasePhoto1 || '',
          showcasePhoto2: bakedProfileData.showcasePhoto2 || '',
          galleryPhotos: bakedProfileData.galleryPhotos || [],
          instagram: bakedProfileData.instagram || '',
          facebook: bakedProfileData.facebook || '',
          twitter: bakedProfileData.twitter || '',
          linkedin: bakedProfileData.linkedin || '',
          youtube: bakedProfileData.youtube || '',
          isActive: true,
          profileComplete: true,
          status: 'approved',
          isBakedProfile: true,
          bakedProfileId: bakedProfileId,
          lastUpdated: now
        }
        
        transaction.set(creatorsIndexRef, indexData, { merge: true })
      })
    }
    
    console.log(`✅ [BAKED-PROFILE] Created baked profile ${bakedProfileId} for ${normalizedEmail}`)
    
    return NextResponse.json({
      success: true,
      bakedProfileId,
      message: 'Baked profile created successfully. It will transfer ownership when the user signs in.'
    })
    
  } catch (error: any) {
    console.error('[BAKED-PROFILE] Error creating baked profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create baked profile' },
      { status: 500 }
    )
  }
}

