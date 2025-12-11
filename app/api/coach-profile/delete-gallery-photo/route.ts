import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * DELETE /api/coach-profile/delete-gallery-photo?photoUrl=xxx
 * 
 * AIRTIGHT: Delete gallery photo and sync to Browse Coaches immediately.
 */
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const photoUrl = searchParams.get('photoUrl')
    
    if (!photoUrl) {
      return NextResponse.json(
        { error: 'Missing photoUrl parameter' },
        { status: 400 }
      )
    }
    
    // Get current profile
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    if (!creatorDoc.exists) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    const profileData = creatorDoc.data()
    
    // SECURITY: Verify the profile belongs to the authenticated user
    const profileUid = profileData?.uid || creatorDoc.id
    if (profileUid !== uid) {
      console.error(`[SECURITY] Unauthorized delete attempt: user ${uid} tried to delete photo from profile ${profileUid}`)
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete photos from your own profile' },
        { status: 403 }
      )
    }
    
    const currentGalleryPhotos = (profileData?.galleryPhotos || []) as string[]
    
    // SECURITY: Verify the photo actually exists in this user's gallery
    if (!currentGalleryPhotos.includes(photoUrl)) {
      console.error(`[SECURITY] Photo not found in user's gallery: user ${uid} tried to delete photo ${photoUrl}`)
      return NextResponse.json(
        { error: 'Photo not found in your gallery' },
        { status: 404 }
      )
    }
    
    // Remove photo from gallery
    const updatedGalleryPhotos = currentGalleryPhotos.filter(url => url !== photoUrl)
    
    const now = new Date()
    const updateData = {
      galleryPhotos: updatedGalleryPhotos,
      updatedAt: now,
      lastUpdated: now
    }
    
    // Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      // Update creator_profiles
      transaction.set(creatorRef, updateData, { merge: true })
      
      // Also update coach_profiles
      const coachRef = db.collection('coach_profiles').doc(uid)
      transaction.set(coachRef, updateData, { merge: true })
    })
    
    // AIRTIGHT: Immediately sync to creators_index for Browse Coaches
    const syncResult = await syncCoachToBrowseCoaches(uid, {
      uid,
      galleryPhotos: updatedGalleryPhotos
    })
    
    if (!syncResult.success) {
      console.error(`[COACH-PROFILE/DELETE-GALLERY-PHOTO] Failed to sync to Browse Coaches: ${syncResult.error}`)
    }
    
    console.log(`✅ [COACH-PROFILE/DELETE-GALLERY-PHOTO] Photo deleted for ${uid} and synced to Browse Coaches`)
    
    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
      syncedToBrowse: syncResult.success
    })
    
  } catch (error: any) {
    console.error('[COACH-PROFILE/DELETE-GALLERY-PHOTO] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

