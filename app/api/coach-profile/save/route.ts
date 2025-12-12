import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type CoachProfileUpdateBody = {
  displayName?: string
  bio?: string
  location?: string
  sport?: string
  profileImageUrl?: string
  showcasePhoto1?: string
  showcasePhoto2?: string
  galleryPhotos?: string[]
  instagram?: string
  facebook?: string
  twitter?: string
  linkedin?: string
  youtube?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
    facebook?: string
    youtube?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[COACH-PROFILE/SAVE] Received save request')
    const authResult = await requireAuth(request, ['coach', 'creator', 'admin', 'superadmin'])

    if (!authResult.success) {
      console.error(`[COACH-PROFILE/SAVE] Authentication failed: ${authResult.error} (status: ${authResult.status})`)
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    console.log(`[COACH-PROFILE/SAVE] Authentication successful for user ${authResult.user.uid}`)

    const { user } = authResult
    const uid = user.uid

    const body = (await request.json()) as CoachProfileUpdateBody

    // Basic guard – nothing to update
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 })
    }

    const now = new Date()

    // Build a sanitized update object (strip undefined)
    const profileUpdates: Record<string, any> = {}
    const userUpdates: Record<string, any> = {}

    const assignIfDefined = (target: Record<string, any>, key: string, value: any) => {
      if (value !== undefined) {
        target[key] = value
      }
    }

    // CRITICAL: Always save displayName - it's always sent as a string (never undefined)
    // This ensures name changes are always persisted
    const displayNameToSave = (body.displayName || '').trim()
    profileUpdates.displayName = displayNameToSave
    userUpdates.displayName = displayNameToSave
    console.log(`[COACH-PROFILE/SAVE] Saving displayName: "${displayNameToSave}" to collections`)
    assignIfDefined(profileUpdates, 'bio', body.bio)
    assignIfDefined(profileUpdates, 'location', body.location)
    assignIfDefined(profileUpdates, 'sport', body.sport)
    assignIfDefined(profileUpdates, 'profileImageUrl', body.profileImageUrl)
    assignIfDefined(profileUpdates, 'showcasePhoto1', body.showcasePhoto1)
    assignIfDefined(profileUpdates, 'showcasePhoto2', body.showcasePhoto2)
    assignIfDefined(profileUpdates, 'galleryPhotos', body.galleryPhotos)
    assignIfDefined(profileUpdates, 'instagram', body.instagram)
    assignIfDefined(profileUpdates, 'facebook', body.facebook)
    assignIfDefined(profileUpdates, 'twitter', body.twitter)
    assignIfDefined(profileUpdates, 'linkedin', body.linkedin)
    assignIfDefined(profileUpdates, 'youtube', body.youtube)
    assignIfDefined(profileUpdates, 'socialLinks', body.socialLinks)
    profileUpdates.updatedAt = now

    // Mirror key profile fields into users document for backward compatibility
    // displayName already handled above - don't duplicate
    assignIfDefined(userUpdates, 'bio', body.bio)
    assignIfDefined(userUpdates, 'location', body.location)
    assignIfDefined(userUpdates, 'sport', body.sport)
    assignIfDefined(userUpdates, 'profileImageUrl', body.profileImageUrl)
    // Keep legacy photoURL in sync so any older views (e.g. athlete dashboards)
    // always show the latest headshot.
    if (body.profileImageUrl) {
      userUpdates.photoURL = body.profileImageUrl
    }
    assignIfDefined(userUpdates, 'showcasePhoto1', body.showcasePhoto1)
    assignIfDefined(userUpdates, 'showcasePhoto2', body.showcasePhoto2)
    assignIfDefined(userUpdates, 'galleryPhotos', body.galleryPhotos)
    assignIfDefined(userUpdates, 'instagram', body.instagram)
    assignIfDefined(userUpdates, 'facebook', body.facebook)
    assignIfDefined(userUpdates, 'twitter', body.twitter)
    assignIfDefined(userUpdates, 'linkedin', body.linkedin)
    assignIfDefined(userUpdates, 'youtube', body.youtube)
    assignIfDefined(userUpdates, 'socialLinks', body.socialLinks)

    // SECURITY: Verify the profile belongs to the authenticated user before updating
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    if (creatorDoc.exists) {
      const profileData = creatorDoc.data()
      const profileUid = profileData?.uid || creatorDoc.id
      if (profileUid !== uid) {
        console.error(`[SECURITY] Unauthorized update attempt: user ${uid} tried to update profile ${profileUid}`)
        return NextResponse.json({ error: 'Unauthorized: You can only update your own profile' }, { status: 403 })
      }
    }

    const batch = db.batch()

    // Save to creator_profiles (primary collection)
    batch.set(creatorRef, profileUpdates, { merge: true })

    // Also save to coach_profiles for consistency (some components load from both)
    const coachRef = db.collection('coach_profiles').doc(uid)
    batch.set(coachRef, profileUpdates, { merge: true })

    // Mirror key fields to users collection for backward compatibility
    const userRef = db.collection('users').doc(uid)
    if (Object.keys(userUpdates).length > 0) {
      batch.set(userRef, userUpdates, { merge: true })
    }

    // Commit the batch write - this ensures all updates are atomic
    await batch.commit()
    console.log(`[COACH-PROFILE/SAVE] Batch committed for ${uid}`)
    
    // Log successful save for debugging
    console.log(`[COACH-PROFILE/SAVE] Successfully saved profile for ${uid}`, {
      displayName: body.displayName,
      hasProfileUpdates: Object.keys(profileUpdates).length > 0,
      hasUserUpdates: Object.keys(userUpdates).length > 0,
      profileUpdates: profileUpdates,
      userUpdates: userUpdates
    })

    // CRITICAL: Ensure visibility fields are ALWAYS set to visible for active coaches
    // This ensures coaches appear in admin panel and Browse Coaches
    const visibilityData = {
      uid,
      ...profileUpdates,
      // AGGRESSIVE: Always set to visible unless explicitly false
      isActive: true, // Always active for coaches saving their profile
      profileComplete: true, // If they're saving, profile is complete
      status: 'approved' // Always approved for active coaches
    }
    
    // CRITICAL: Update creator_profiles with visibility fields BEFORE sync
    await creatorRef.set({
      isActive: visibilityData.isActive,
      profileComplete: visibilityData.profileComplete,
      status: visibilityData.status
    }, { merge: true })
    
    console.log(`[COACH-PROFILE/SAVE] CRITICAL: Set visibility fields to visible:`, {
      isActive: visibilityData.isActive,
      profileComplete: visibilityData.profileComplete,
      status: visibilityData.status
    })
    
    // AGGRESSIVE FIX: Use centralized sync function that reads FULL profile
    // This ensures ALL fields are synced, not just what was updated
    const syncResult = await syncCoachToBrowseCoaches(uid, visibilityData)
    
    if (!syncResult.success) {
      console.error(`❌ [COACH-PROFILE/SAVE] CRITICAL: Failed to sync to Browse Coaches: ${syncResult.error}`)
      console.error(`   This means profile edits may not appear in Browse Coaches immediately!`)
      // Don't fail the request, but log prominently
    } else {
      console.log(`✅ [COACH-PROFILE/SAVE] Successfully synced ALL profile fields to Browse Coaches for ${uid}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving coach profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save profile' },
      { status: 500 }
    )
  }
}


