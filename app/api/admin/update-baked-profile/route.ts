import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * PUT /api/admin/update-baked-profile
 * 
 * Update a baked profile. Only allowed if status is 'pending' (not ready yet).
 * Admin only.
 */
export async function PUT(request: NextRequest) {
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
    const { bakedProfileId, ...updateData } = body
    
    if (!bakedProfileId) {
      return NextResponse.json(
        { error: 'Missing bakedProfileId' },
        { status: 400 }
      )
    }
    
    // Get current baked profile
    const bakedProfileRef = db.collection('baked_profiles').doc(bakedProfileId)
    const bakedProfileDoc = await bakedProfileRef.get()
    
    if (!bakedProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Baked profile not found' },
        { status: 404 }
      )
    }
    
    const currentData = bakedProfileDoc.data()
    
    // SECURITY: Only allow updates if status is 'pending' (not ready yet)
    if (currentData?.status === 'ready') {
      return NextResponse.json(
        { error: 'Cannot update baked profile that is marked as ready. Profile is locked for editing.' },
        { status: 403 }
      )
    }
    
    if (currentData?.status === 'transferred') {
      return NextResponse.json(
        { error: 'Cannot update baked profile that has been transferred' },
        { status: 403 }
      )
    }
    
    // AIRTIGHT: Normalize and validate email if provided
    if (updateData.targetEmail) {
      const normalizedEmail = updateData.targetEmail.toLowerCase().trim()
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        )
      }
      updateData.targetEmail = normalizedEmail
      updateData.email = normalizedEmail
    }
    
    // AIRTIGHT: Use transaction to ensure atomic update
    let updatedData: any = {}
    await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      // Re-read to ensure status hasn't changed
      const latestDoc = await transaction.get(bakedProfileRef)
      if (!latestDoc.exists) {
        throw new Error('Baked profile not found')
      }
      
      const latestData = latestDoc.data()
      
      // Double-check status
      if (latestData?.status === 'ready') {
        throw new Error('Cannot update baked profile that is marked as ready. Profile is locked for editing.')
      }
      
      if (latestData?.status === 'transferred') {
        throw new Error('Cannot update baked profile that has been transferred')
      }
      
      // Merge update data with existing data
      updatedData = {
        ...latestData,
        ...updateData,
        updatedAt: new Date()
      }
      
      transaction.update(bakedProfileRef, {
        ...updateData,
        updatedAt: new Date()
      })
    })
    
    // AIRTIGHT: If visible in Browse Coaches, sync to creators_index immediately
    if (updatedData.visibleInBrowseCoaches) {
      // Use bakedProfileId as temporary UID until transferred
      const syncResult = await syncCoachToBrowseCoaches(bakedProfileId, {
        uid: bakedProfileId,
        displayName: updatedData.displayName || '',
        firstName: updatedData.firstName || '',
        lastName: updatedData.lastName || '',
        email: updatedData.email || updatedData.targetEmail || '',
        sport: updatedData.sport || '',
        location: updatedData.location || '',
        bio: updatedData.bio || '',
        tagline: updatedData.tagline || '',
        credentials: updatedData.credentials || '',
        philosophy: updatedData.philosophy || '',
        profileImageUrl: updatedData.profileImageUrl || updatedData.headshotUrl || '',
        headshotUrl: updatedData.headshotUrl || updatedData.profileImageUrl || '',
        heroImageUrl: updatedData.heroImageUrl || '',
        showcasePhoto1: updatedData.showcasePhoto1 || '',
        showcasePhoto2: updatedData.showcasePhoto2 || '',
        galleryPhotos: updatedData.galleryPhotos || [],
        instagram: updatedData.instagram || updatedData.socialLinks?.instagram || '',
        facebook: updatedData.facebook || updatedData.socialLinks?.facebook || '',
        twitter: updatedData.twitter || updatedData.socialLinks?.twitter || '',
        linkedin: updatedData.linkedin || updatedData.socialLinks?.linkedin || '',
        youtube: updatedData.youtube || updatedData.socialLinks?.youtube || '',
        socialLinks: updatedData.socialLinks || {},
        isActive: true,
        profileComplete: true,
        status: 'approved',
        isBakedProfile: true,
        bakedProfileId: bakedProfileId
      })
      
      if (!syncResult.success) {
        console.error(`[UPDATE-BAKED-PROFILE] Failed to sync to Browse Coaches: ${syncResult.error}`)
      } else {
        console.log(`✅ [UPDATE-BAKED-PROFILE] Synced baked profile ${bakedProfileId} to Browse Coaches`)
      }
    }
    
    console.log(`✅ Baked profile updated: ${bakedProfileId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Baked profile updated successfully',
      syncedToBrowse: updatedData.visibleInBrowseCoaches || false
    })
    
  } catch (error) {
    console.error('Error updating baked profile:', error)
    return NextResponse.json(
      { error: 'Failed to update baked profile' },
      { status: 500 }
    )
  }
}

