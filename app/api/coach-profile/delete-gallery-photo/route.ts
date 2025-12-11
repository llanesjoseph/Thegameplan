import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['coach', 'creator', 'admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const uid = user.uid

    const { searchParams } = new URL(request.url)
    const photoUrl = searchParams.get('photoUrl')

    if (!photoUrl) {
      return NextResponse.json({ error: 'Missing photoUrl parameter' }, { status: 400 })
    }

    // Get current profile to find the photo index
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()

    if (!creatorDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profileData = creatorDoc.data()
    const currentGalleryPhotos = (profileData?.galleryPhotos || []) as string[]

    // Remove the photo from the array
    const updatedGalleryPhotos = currentGalleryPhotos.filter((url) => url !== photoUrl)

    // Update both collections
    const batch = db.batch()

    // Update creator_profiles
    batch.update(creatorRef, {
      galleryPhotos: updatedGalleryPhotos,
      updatedAt: new Date()
    })

    // Update coach_profiles
    const coachRef = db.collection('coach_profiles').doc(uid)
    batch.update(coachRef, {
      galleryPhotos: updatedGalleryPhotos,
      updatedAt: new Date()
    })

    // Update users collection for backward compatibility
    const userRef = db.collection('users').doc(uid)
    batch.update(userRef, {
      galleryPhotos: updatedGalleryPhotos,
      updatedAt: new Date()
    })

    await batch.commit()

    console.log(`[COACH-PROFILE/DELETE-GALLERY-PHOTO] Deleted photo for ${uid}`)

    return NextResponse.json({ 
      success: true, 
      galleryPhotos: updatedGalleryPhotos 
    })
  } catch (error: any) {
    console.error('Error deleting gallery photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

