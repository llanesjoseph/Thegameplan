import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/toggle-baked-profile-visibility
 * 
 * Toggle visibility of baked profile in Browse Coaches.
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
    const { bakedProfileId, visible } = body
    
    if (!bakedProfileId || typeof visible !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing bakedProfileId or visible flag' },
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
    const now = new Date()
    
    // AIRTIGHT: Use transaction to ensure atomic visibility toggle and sync
    await db.runTransaction(async (transaction) => {
      // Re-read to ensure we have latest data
      const latestDoc = await transaction.get(bakedProfileRef)
      if (!latestDoc.exists) {
        throw new Error('Baked profile not found')
      }
      
      const latestData = latestDoc.data()
      
      if (visible) {
        // Add to creators_index for Browse Coaches
        const creatorsIndexRef = db.collection('creators_index').doc(bakedProfileId)
        const indexData: any = {
          uid: bakedProfileId,
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
          isBakedProfile: true,
          bakedProfileId: bakedProfileId,
          lastUpdated: now
        }
        
        transaction.set(creatorsIndexRef, indexData, { merge: true })
        transaction.update(bakedProfileRef, {
          visibleInBrowseCoaches: true,
          updatedAt: now
        })
        
        console.log(`✅ Baked profile ${bakedProfileId} made visible in Browse Coaches`)
      } else {
        // Remove from creators_index
        const creatorsIndexRef = db.collection('creators_index').doc(bakedProfileId)
        transaction.delete(creatorsIndexRef)
        transaction.update(bakedProfileRef, {
          visibleInBrowseCoaches: false,
          updatedAt: now
        })
        
        console.log(`✅ Baked profile ${bakedProfileId} hidden from Browse Coaches`)
      }
    })
    
    return NextResponse.json({
      success: true,
      visible,
      message: `Baked profile ${visible ? 'made visible' : 'hidden'} in Browse Coaches`
    })
    
  } catch (error) {
    console.error('Error toggling baked profile visibility:', error)
    return NextResponse.json(
      { error: 'Failed to toggle baked profile visibility' },
      { status: 500 }
    )
  }
}

