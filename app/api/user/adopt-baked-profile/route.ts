import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/user/adopt-baked-profile
 * 
 * AIRTIGHT: Auto-adopt baked profile when user signs in.
 * This is called automatically on every login to ensure adoption happens.
 * Uses transactions to prevent race conditions.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { user } = authResult
    const userEmail = user.email?.toLowerCase().trim()
    const userUid = user.uid
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }
    
    console.log(`[BAKED-PROFILE-ADOPTION] Checking for baked profile for user ${userUid} (${userEmail})`)
    
    // Use transaction to prevent race conditions
    return await db.runTransaction(async (transaction) => {
      // Find baked profile by email (case-insensitive, trimmed)
      const emailQuery = await db.collection('baked_profiles')
        .where('targetEmail', '==', userEmail)
        .where('status', 'in', ['pending', 'ready'])
        .limit(1)
        .get()
      
      let bakedProfile: any = null
      let bakedProfileId: string | null = null
      
      if (!emailQuery.empty) {
        const doc = emailQuery.docs[0]
        bakedProfileId = doc.id
        bakedProfile = { bakedProfileId, ...doc.data() }
      }
      
      // Also check by UID if provided
      if (!bakedProfile) {
        const uidQuery = await db.collection('baked_profiles')
          .where('targetUid', '==', userUid)
          .where('status', 'in', ['pending', 'ready'])
          .limit(1)
          .get()
        
        if (!uidQuery.empty) {
          const doc = uidQuery.docs[0]
          bakedProfileId = doc.id
          bakedProfile = { bakedProfileId, ...doc.data() }
        }
      }
      
      if (!bakedProfile) {
        console.log(`[BAKED-PROFILE-ADOPTION] No baked profile found for ${userEmail}`)
        return NextResponse.json({
          success: true,
          adopted: false,
          message: 'No baked profile found'
        })
      }
      
      // SECURITY: Verify email matches (case-insensitive)
      const profileEmail = bakedProfile.targetEmail?.toLowerCase().trim()
      if (profileEmail !== userEmail) {
        console.error(`[BAKED-PROFILE-ADOPTION] Email mismatch: profile=${profileEmail}, user=${userEmail}`)
        return NextResponse.json({
          success: false,
          error: 'Email mismatch'
        }, { status: 400 })
      }
      
      // Check if already transferred
      if (bakedProfile.status === 'transferred') {
        console.log(`[BAKED-PROFILE-ADOPTION] Baked profile ${bakedProfileId} already transferred`)
        return NextResponse.json({
          success: true,
          adopted: false,
          message: 'Baked profile already transferred'
        })
      }
      
      // Check if user already has a profile (prevent overwriting)
      const existingCreatorRef = db.collection('creator_profiles').doc(userUid)
      const existingCreatorDoc = await transaction.get(existingCreatorRef)
      
      if (existingCreatorDoc.exists) {
        const existingData = existingCreatorDoc.data()
        // If user already has a profile that wasn't from a baked profile, don't overwrite
        if (!existingData?.transferredFromBakedProfile) {
          console.log(`[BAKED-PROFILE-ADOPTION] User ${userUid} already has a profile, skipping adoption`)
          return NextResponse.json({
            success: true,
            adopted: false,
            message: 'User already has a profile'
          })
        }
      }
      
      // Prepare profile data with ALL fields
      const now = new Date()
      const profileData: any = {
        uid: userUid,
        displayName: bakedProfile.displayName || '',
        firstName: bakedProfile.firstName || '',
        lastName: bakedProfile.lastName || '',
        email: userEmail,
        sport: bakedProfile.sport || '',
        location: bakedProfile.location || '',
        tagline: bakedProfile.tagline || '',
        credentials: bakedProfile.credentials || '',
        bio: bakedProfile.bio || '',
        philosophy: bakedProfile.philosophy || '',
        specialties: bakedProfile.specialties || [],
        achievements: bakedProfile.achievements || [],
        experience: bakedProfile.experience || '',
        // All image fields
        profileImageUrl: bakedProfile.profileImageUrl || bakedProfile.headshotUrl || '',
        headshotUrl: bakedProfile.headshotUrl || bakedProfile.profileImageUrl || '',
        heroImageUrl: bakedProfile.heroImageUrl || '',
        showcasePhoto1: bakedProfile.showcasePhoto1 || '',
        showcasePhoto2: bakedProfile.showcasePhoto2 || '',
        galleryPhotos: bakedProfile.galleryPhotos || [],
        actionPhotos: bakedProfile.actionPhotos || [],
        highlightVideo: bakedProfile.highlightVideo || '',
        // Social links
        instagram: bakedProfile.instagram || bakedProfile.socialLinks?.instagram || '',
        facebook: bakedProfile.facebook || bakedProfile.socialLinks?.facebook || '',
        twitter: bakedProfile.twitter || bakedProfile.socialLinks?.twitter || '',
        linkedin: bakedProfile.linkedin || bakedProfile.socialLinks?.linkedin || '',
        youtube: bakedProfile.youtube || bakedProfile.socialLinks?.youtube || '',
        socialLinks: bakedProfile.socialLinks || {
          instagram: bakedProfile.instagram || '',
          facebook: bakedProfile.facebook || '',
          twitter: bakedProfile.twitter || '',
          linkedin: bakedProfile.linkedin || '',
          youtube: bakedProfile.youtube || ''
        },
        profileCompleteness: bakedProfile.profileCompleteness || 100,
        isVerified: bakedProfile.isVerified ?? true,
        isPlatformCoach: bakedProfile.isPlatformCoach ?? true,
        role: 'coach',
        isActive: true,
        createdAt: bakedProfile.createdAt || now,
        updatedAt: now,
        // Mark as transferred from baked profile
        transferredFromBakedProfile: true,
        bakedProfileId: bakedProfileId
      }
      
      // ATOMIC TRANSACTION: Update all collections at once
      const creatorRef = db.collection('creator_profiles').doc(userUid)
      const coachRef = db.collection('coach_profiles').doc(userUid)
      const userRef = db.collection('users').doc(userUid)
      const bakedRef = db.collection('baked_profiles').doc(bakedProfileId!)
      const creatorsIndexRef = db.collection('creators_index').doc(userUid)
      const oldBakedIndexRef = db.collection('creators_index').doc(bakedProfileId!)
      
      // Set creator_profiles
      transaction.set(creatorRef, profileData, { merge: true })
      
      // Set coach_profiles
      transaction.set(coachRef, profileData, { merge: true })
      
      // Update users collection
      transaction.set(userRef, {
        displayName: profileData.displayName,
        role: 'coach',
        creatorStatus: 'approved',
        profileProvisioned: true,
        updatedAt: now
      }, { merge: true })
      
      // Mark baked profile as transferred
      transaction.update(bakedRef, {
        status: 'transferred',
        transferredAt: now,
        transferredTo: userUid
      })
      
      // Update creators_index with real UID (replace bakedProfileId with userUid)
      const indexData: any = {
        uid: userUid,
        displayName: profileData.displayName,
        name: profileData.displayName,
        email: userEmail,
        sport: profileData.sport,
        location: profileData.location || '',
        bio: profileData.bio || '',
        profileImageUrl: profileData.profileImageUrl || profileData.headshotUrl || '',
        headshotUrl: profileData.profileImageUrl || profileData.headshotUrl || '',
        photoURL: profileData.profileImageUrl || profileData.headshotUrl || '',
        showcasePhoto1: profileData.showcasePhoto1 || '',
        showcasePhoto2: profileData.showcasePhoto2 || '',
        galleryPhotos: profileData.galleryPhotos || [],
        instagram: profileData.instagram || '',
        facebook: profileData.facebook || '',
        twitter: profileData.twitter || '',
        linkedin: profileData.linkedin || '',
        youtube: profileData.youtube || '',
        isActive: true,
        profileComplete: true,
        status: 'approved',
        lastUpdated: now
      }
      transaction.set(creatorsIndexRef, indexData, { merge: true })
      
      // Remove old baked profile entry from creators_index if it exists
      transaction.delete(oldBakedIndexRef)
      
      console.log(`✅ [BAKED-PROFILE-ADOPTION] Successfully adopted baked profile ${bakedProfileId} for user ${userUid}`)
      
      return NextResponse.json({
        success: true,
        adopted: true,
        bakedProfileId,
        message: 'Baked profile adopted successfully'
      })
    })
    
  } catch (error: any) {
    console.error('[BAKED-PROFILE-ADOPTION] CRITICAL ERROR:', error)
    
    // If transaction fails, return error but don't crash
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to adopt baked profile',
      adopted: false
    }, { status: 500 })
  }
}

