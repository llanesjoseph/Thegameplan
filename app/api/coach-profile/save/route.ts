import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/coach-profile/save
 * 
 * AIRTIGHT: Save coach profile and sync to Browse Coaches immediately.
 * Any change to coach profile is reflected in Browse Coaches.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['coach', 'creator', 'admin', 'superadmin'])
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { user } = authResult
    const uid = user.uid
    const body = await request.json()
    
    // SECURITY: Verify the profile belongs to the authenticated user
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    if (creatorDoc.exists) {
      const profileData = creatorDoc.data()
      const profileUid = profileData?.uid || creatorDoc.id
      if (profileUid !== uid) {
        console.error(`[SECURITY] Unauthorized update attempt: user ${uid} tried to update profile ${profileUid}`)
        return NextResponse.json(
          { error: 'Unauthorized: You can only update your own profile' },
          { status: 403 }
        )
      }
    }
    
    // Prepare update data
    const now = new Date()
    const updateData: any = {
      updatedAt: now,
      lastUpdated: now
    }
    
    // Update all provided fields
    if (body.displayName !== undefined) updateData.displayName = (body.displayName || '').trim()
    if (body.firstName !== undefined) updateData.firstName = (body.firstName || '').trim()
    if (body.lastName !== undefined) updateData.lastName = (body.lastName || '').trim()
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.location !== undefined) updateData.location = (body.location || '').trim()
    if (body.sport !== undefined) updateData.sport = (body.sport || '').trim()
    if (body.tagline !== undefined) updateData.tagline = (body.tagline || '').trim()
    if (body.credentials !== undefined) updateData.credentials = body.credentials
    if (body.philosophy !== undefined) updateData.philosophy = body.philosophy
    if (body.experience !== undefined) updateData.experience = body.experience
    
    // Images
    if (body.profileImageUrl !== undefined) updateData.profileImageUrl = (body.profileImageUrl || '').trim()
    if (body.headshotUrl !== undefined) updateData.headshotUrl = (body.headshotUrl || '').trim()
    if (body.heroImageUrl !== undefined) updateData.heroImageUrl = (body.heroImageUrl || '').trim()
    if (body.showcasePhoto1 !== undefined) updateData.showcasePhoto1 = (body.showcasePhoto1 || '').trim()
    if (body.showcasePhoto2 !== undefined) updateData.showcasePhoto2 = (body.showcasePhoto2 || '').trim()
    if (body.galleryPhotos !== undefined) {
      updateData.galleryPhotos = Array.isArray(body.galleryPhotos)
        ? body.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
    }
    
    // Social links
    if (body.instagram !== undefined) updateData.instagram = (body.instagram || '').trim()
    if (body.facebook !== undefined) updateData.facebook = (body.facebook || '').trim()
    if (body.twitter !== undefined) updateData.twitter = (body.twitter || '').trim()
    if (body.linkedin !== undefined) updateData.linkedin = (body.linkedin || '').trim()
    if (body.youtube !== undefined) updateData.youtube = (body.youtube || '').trim()
    if (body.socialLinks !== undefined) {
      updateData.socialLinks = {
        instagram: (body.socialLinks.instagram || '').trim(),
        facebook: (body.socialLinks.facebook || '').trim(),
        twitter: (body.socialLinks.twitter || '').trim(),
        linkedin: (body.socialLinks.linkedin || '').trim(),
        youtube: (body.socialLinks.youtube || '').trim()
      }
    }
    
    // Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      // Update creator_profiles
      transaction.set(creatorRef, updateData, { merge: true })
      
      // Also update coach_profiles for consistency
      const coachRef = db.collection('coach_profiles').doc(uid)
      transaction.set(coachRef, updateData, { merge: true })
      
      // Update users collection
      if (body.displayName !== undefined) {
        const userRef = db.collection('users').doc(uid)
        transaction.set(userRef, {
          displayName: updateData.displayName,
          updatedAt: now
        }, { merge: true })
      }
    })
    
    // AIRTIGHT: Immediately sync to creators_index for Browse Coaches
    // This ensures changes appear instantly in Browse Coaches
    const syncResult = await syncCoachToBrowseCoaches(uid, {
      uid,
      ...updateData
    })
    
    if (!syncResult.success) {
      console.error(`[COACH-PROFILE/SAVE] Failed to sync to Browse Coaches: ${syncResult.error}`)
      // Don't fail the request, but log the error
      // The profile was saved successfully, sync failure is non-critical
    }
    
    console.log(`✅ [COACH-PROFILE/SAVE] Profile updated for ${uid} and synced to Browse Coaches`)
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      syncedToBrowse: syncResult.success
    })
    
  } catch (error: any) {
    console.error('[COACH-PROFILE/SAVE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save profile' },
      { status: 500 }
    )
  }
}

