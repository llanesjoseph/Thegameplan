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
      highlightVideo
    } = body

    // Validate at least one field is provided
    if (!headshotUrl && !heroImageUrl && !actionPhotos && !highlightVideo) {
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
      updateData.actionPhotos = actionPhotos
    }

    if (highlightVideo) {
      updateData.highlightVideo = highlightVideo
    }

    // Update coach profile in Firestore
    await db.collection('creator_profiles').doc(authUser.uid).update(updateData)

    // AGGRESSIVE FIX: Use centralized sync function that reads FULL profile
    // This ensures ALL fields are synced, including the new images
    const syncResult = await syncCoachToBrowseCoaches(authUser.uid, {
      uid: authUser.uid,
      ...updateData
    })
    
    if (!syncResult.success) {
      console.error(`❌ [COACH-PROFILE/UPDATE-IMAGES] CRITICAL: Failed to sync to Browse Coaches: ${syncResult.error}`)
      console.error(`   This means image updates may not appear in Browse Coaches immediately!`)
      // Don't throw - allow the update to succeed even if index update fails
    } else {
      console.log(`✅ [COACH-PROFILE/UPDATE-IMAGES] Successfully synced image updates to Browse Coaches for ${authUser.uid}`)
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