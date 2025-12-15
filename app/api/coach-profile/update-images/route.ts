import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface UpdateImagesRequest {
  headshotUrl?: string
  heroImageUrl?: string
  actionPhotos?: string[]
  galleryPhotos?: string[]
  showcasePhoto1?: string
  showcasePhoto2?: string
  highlightVideo?: string
}

export async function POST(request: NextRequest) {
  try {
    // Require coach role to update profile images
    const authResult = await requireAuth(request, ['creator', 'coach', 'admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult
    const body = await request.json() as UpdateImagesRequest

    const {
      headshotUrl,
      heroImageUrl,
      actionPhotos,
      galleryPhotos,
      showcasePhoto1,
      showcasePhoto2,
      highlightVideo
    } = body

    // Validate at least one field is provided
    if (!headshotUrl && !heroImageUrl && !actionPhotos && !galleryPhotos && !showcasePhoto1 && !showcasePhoto2 && !highlightVideo) {
      return NextResponse.json(
        { error: 'At least one image or video field must be provided' },
        { status: 400 }
      )
    }

    // Check if coach profile exists
    // FIXED: Coaches use creator_profiles collection, same as creators
    const coachProfileDoc = await db.collection('creator_profiles').doc(authUser.uid).get()

    if (!coachProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Coach profile not found. Only approved coaches can update profile images.' },
        { status: 404 }
      )
    }

    const currentProfile = coachProfileDoc.data()
    
    // SECURITY: Verify the profile belongs to the authenticated user
    const profileUid = currentProfile?.uid || coachProfileDoc.id
    if (profileUid !== authUser.uid) {
      console.error(`[SECURITY] Unauthorized update attempt: user ${authUser.uid} tried to update images for profile ${profileUid}`)
      return NextResponse.json({ error: 'Unauthorized: You can only update your own profile images' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (headshotUrl) {
      updateData.headshotUrl = headshotUrl
    }

    if (heroImageUrl) {
      updateData.heroImageUrl = heroImageUrl
    }

    if (actionPhotos) {
      // Validate action photos array
      if (!Array.isArray(actionPhotos)) {
        return NextResponse.json(
          { error: 'actionPhotos must be an array of URLs' },
          { status: 400 }
        )
      }
      // IRONCLAD: Save actionPhotos and also sync to galleryPhotos for consistency
      updateData.actionPhotos = actionPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      // If galleryPhotos not provided, use actionPhotos as galleryPhotos
      if (!galleryPhotos) {
        updateData.galleryPhotos = updateData.actionPhotos
      }
    }

    if (galleryPhotos) {
      // Validate gallery photos array
      if (!Array.isArray(galleryPhotos)) {
        return NextResponse.json(
          { error: 'galleryPhotos must be an array of URLs' },
          { status: 400 }
        )
      }
      // IRONCLAD: Save galleryPhotos - this is the primary field for gallery display
      updateData.galleryPhotos = galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
    }

    if (showcasePhoto1) {
      updateData.showcasePhoto1 = showcasePhoto1.trim()
    }

    if (showcasePhoto2) {
      updateData.showcasePhoto2 = showcasePhoto2.trim()
    }

    if (highlightVideo) {
      updateData.highlightVideo = highlightVideo
    }

    // IRONCLAD: Save to ALL collections to ensure photos are always visible
    const batch = db.batch()
    
    // 1. Save to creator_profiles (primary collection)
    const creatorRef = db.collection('creator_profiles').doc(authUser.uid)
    batch.set(creatorRef, updateData, { merge: true })
    
    // 2. Save to coach_profiles (for components that check this collection)
    const coachRef = db.collection('coach_profiles').doc(authUser.uid)
    batch.set(coachRef, updateData, { merge: true })
    
    // 3. Save to users collection (for backward compatibility)
    const userRef = db.collection('users').doc(authUser.uid)
    const userUpdateData: any = {
      updatedAt: updateData.updatedAt
    }
    if (headshotUrl) userUpdateData.profileImageUrl = headshotUrl
    if (headshotUrl) userUpdateData.photoURL = headshotUrl // Legacy field
    if (showcasePhoto1) userUpdateData.showcasePhoto1 = showcasePhoto1
    if (showcasePhoto2) userUpdateData.showcasePhoto2 = showcasePhoto2
    if (galleryPhotos || actionPhotos) {
      userUpdateData.galleryPhotos = updateData.galleryPhotos || updateData.actionPhotos || []
    }
    batch.set(userRef, userUpdateData, { merge: true })
    
    // Commit all writes atomically
    await batch.commit()
    console.log(`✅ [COACH-PROFILE/UPDATE-IMAGES] IRONCLAD: Saved photos to creator_profiles, coach_profiles, and users for ${authUser.uid}`)

    // IRONCLAD: Sync to creators_index with retry logic to ensure it ALWAYS happens
    let syncResult = await syncCoachToBrowseCoaches(authUser.uid, {
      uid: authUser.uid,
      ...updateData
    })
    
    // Retry sync if it fails (up to 2 retries)
    if (!syncResult.success) {
      console.warn(`⚠️ [COACH-PROFILE/UPDATE-IMAGES] First sync attempt failed, retrying...`)
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
      syncResult = await syncCoachToBrowseCoaches(authUser.uid, {
        uid: authUser.uid,
        ...updateData
      })
      
      if (!syncResult.success) {
        console.warn(`⚠️ [COACH-PROFILE/UPDATE-IMAGES] Second sync attempt failed, final retry...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s
        syncResult = await syncCoachToBrowseCoaches(authUser.uid, {
          uid: authUser.uid,
          ...updateData
        })
      }
    }
    
    if (!syncResult.success) {
      console.error(`❌ [COACH-PROFILE/UPDATE-IMAGES] CRITICAL: Failed to sync to Browse Coaches after 3 attempts: ${syncResult.error}`)
      console.error(`   Photos are saved but may not appear in Browse Coaches immediately.`)
      // Don't throw - photos are saved, sync can be retried later
    } else {
      console.log(`✅ [COACH-PROFILE/UPDATE-IMAGES] IRONCLAD: Successfully synced image updates to creators_index for ${authUser.uid}`)
    }

    // Also update the creator data if it exists (for backwards compatibility)
    const creatorQuery = await db.collection('creators').where('email', '==', authUser.email).get()
    if (!creatorQuery.empty) {
      const creatorDoc = creatorQuery.docs[0]
      await db.collection('creators').doc(creatorDoc.id).update(updateData)
    }

    // Calculate profile completeness
    const updatedProfile = { ...currentProfile, ...updateData }
    const completeness = calculateProfileCompleteness(updatedProfile)

    if (completeness !== currentProfile?.profileCompleteness) {
      await db.collection('creator_profiles').doc(authUser.uid).update({
        profileCompleteness: completeness
      })
    }

    // Audit log
    await auditLog('coach_profile_images_updated', {
      userId: authUser.uid,
      email: authUser.email,
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
      profileCompleteness: completeness,
      previousCompleteness: currentProfile?.profileCompleteness || 0
    }, { userId: authUser.uid })

    return NextResponse.json({
      success: true,
      message: 'Profile images updated successfully',
      data: {
        profileCompleteness: completeness,
        updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
      }
    })

  } catch (error) {
    console.error('Update coach profile images error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile images' },
      { status: 500 }
    )
  }
}

function calculateProfileCompleteness(profile: any): number {
  const fields = [
    profile.email,
    profile.firstName,
    profile.lastName,
    profile.sport,
    profile.experience,
    profile.bio,
    profile.tagline,
    profile.philosophy,
    profile.credentials,
    profile.headshotUrl, // Include headshot
    profile.heroImageUrl, // Include hero image
    profile.specialties?.length > 0,
    profile.achievements?.length > 0,
    profile.sampleQuestions?.length > 0,
    profile.actionPhotos?.length > 0, // Include action photos
    profile.highlightVideo // Include highlight video
  ]

  const completedFields = fields.filter(field =>
    field !== undefined && field !== null && field !== ''
  ).length

  return Math.round((completedFields / fields.length) * 100)
}