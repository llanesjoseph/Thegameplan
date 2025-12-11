import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/coach-profile/update-images
 * 
 * AIRTIGHT: Update coach images and sync to Browse Coaches immediately.
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
    
    const { user: authUser } = authResult
    const body = await request.json()
    
    const { headshotUrl, heroImageUrl, actionPhotos, highlightVideo } = body
    
    // Get current profile
    const coachProfileRef = db.collection('coach_profiles').doc(authUser.uid)
    const coachProfileDoc = await coachProfileRef.get()
    
    if (!coachProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      )
    }
    
    const currentProfile = coachProfileDoc.data()
    
    // SECURITY: Verify the profile belongs to the authenticated user
    const profileUid = currentProfile?.uid || coachProfileDoc.id
    if (profileUid !== authUser.uid) {
      console.error(`[SECURITY] Unauthorized update attempt: user ${authUser.uid} tried to update images for profile ${profileUid}`)
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own profile images' },
        { status: 403 }
      )
    }
    
    const now = new Date()
    const updateData: any = {
      updatedAt: now,
      lastUpdated: now
    }
    
    if (headshotUrl !== undefined) {
      updateData.headshotUrl = headshotUrl
      updateData.profileImageUrl = headshotUrl // Also update profileImageUrl
    }
    if (heroImageUrl !== undefined) updateData.heroImageUrl = heroImageUrl
    if (actionPhotos !== undefined) updateData.actionPhotos = actionPhotos
    if (highlightVideo !== undefined) updateData.highlightVideo = highlightVideo
    
    // Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      // Update coach_profiles
      transaction.set(coachProfileRef, updateData, { merge: true })
      
      // Also update creator_profiles for consistency
      const creatorRef = db.collection('creator_profiles').doc(authUser.uid)
      transaction.set(creatorRef, updateData, { merge: true })
    })
    
    // AIRTIGHT: Immediately sync to creators_index for Browse Coaches
    const syncResult = await syncCoachToBrowseCoaches(authUser.uid, {
      uid: authUser.uid,
      ...updateData
    })
    
    if (!syncResult.success) {
      console.error(`[COACH-PROFILE/UPDATE-IMAGES] Failed to sync to Browse Coaches: ${syncResult.error}`)
    }
    
    console.log(`✅ [COACH-PROFILE/UPDATE-IMAGES] Images updated for ${authUser.uid} and synced to Browse Coaches`)
    
    return NextResponse.json({
      success: true,
      message: 'Images updated successfully',
      syncedToBrowse: syncResult.success
    })
    
  } catch (error: any) {
    console.error('[COACH-PROFILE/UPDATE-IMAGES] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update images' },
      { status: 500 }
    )
  }
}

