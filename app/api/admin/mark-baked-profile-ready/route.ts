import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/mark-baked-profile-ready
 * 
 * Mark a baked profile as ready for provisioning. This locks it from further editing.
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
    const { bakedProfileId } = body
    
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
    
    // Check if already transferred
    if (currentData?.status === 'transferred') {
      return NextResponse.json(
        { error: 'Baked profile has already been transferred' },
        { status: 400 }
      )
    }
    
    // AIRTIGHT: Use transaction to ensure atomic status update and sync
    const now = new Date()
    
    await db.runTransaction(async (transaction) => {
      // Re-read to ensure we have latest data
      const latestDoc = await transaction.get(bakedProfileRef)
      if (!latestDoc.exists) {
        throw new Error('Baked profile not found')
      }
      
      const latestData = latestDoc.data()
      
      // Double-check status hasn't changed
      if (latestData?.status === 'transferred') {
        throw new Error('Baked profile has already been transferred')
      }
      
      const updates: any = {
        status: 'ready',
        readyForProvisioning: true,
        readyAt: now,
        updatedAt: now
      }
      
      // If visible in Browse Coaches, sync to creators_index atomically
      if (latestData?.visibleInBrowseCoaches) {
        const creatorsIndexRef = db.collection('creators_index').doc(bakedProfileId)
        const indexData: any = {
          uid: bakedProfileId, // Use bakedProfileId as temporary UID
          displayName: latestData.displayName || '',
          name: latestData.displayName || '',
          email: latestData.email || latestData.targetEmail || '',
          sport: latestData.sport || '',
          location: latestData.location || '',
          bio: latestData.bio || '',
          profileImageUrl: latestData.profileImageUrl || latestData.headshotUrl || '',
          headshotUrl: latestData.profileImageUrl || latestData.headshotUrl || '',
          photoURL: latestData.profileImageUrl || latestData.headshotUrl || '',
          showcasePhoto1: latestData.showcasePhoto1 || '',
          showcasePhoto2: latestData.showcasePhoto2 || '',
          galleryPhotos: latestData.galleryPhotos || [],
          instagram: latestData.instagram || latestData.socialLinks?.instagram || '',
          facebook: latestData.facebook || latestData.socialLinks?.facebook || '',
          twitter: latestData.twitter || latestData.socialLinks?.twitter || '',
          linkedin: latestData.linkedin || latestData.socialLinks?.linkedin || '',
          youtube: latestData.youtube || latestData.socialLinks?.youtube || '',
          isActive: true,
          profileComplete: true,
          status: 'approved',
          isBakedProfile: true, // Flag to identify baked profiles
          bakedProfileId: bakedProfileId,
          lastUpdated: now
        }
        
        transaction.set(creatorsIndexRef, indexData, { merge: true })
      }
      
      transaction.update(bakedProfileRef, updates)
    })
    
    console.log(`✅ Synced baked profile ${bakedProfileId} to creators_index for Browse Coaches (if visible)`)
    
    console.log(`✅ Baked profile marked as ready: ${bakedProfileId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Baked profile marked as ready for provisioning. Profile is now locked for editing.'
    })
    
  } catch (error) {
    console.error('Error marking baked profile as ready:', error)
    return NextResponse.json(
      { error: 'Failed to mark baked profile as ready' },
      { status: 500 }
    )
  }
}

