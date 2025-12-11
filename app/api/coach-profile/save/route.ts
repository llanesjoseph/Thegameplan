import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

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
    const authResult = await requireAuth(request, ['coach', 'creator', 'admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

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

    // CRITICAL: Update creators_index synchronously - this is where Browse Coaches reads from
    // MUST sync ALL profile fields to ensure edits appear immediately in Browse Coaches
    try {
      const creatorsIndexRef = db.collection('creators_index').doc(uid)
      const creatorsDoc = await creatorsIndexRef.get()

      const displayNameToSave = (body.displayName || '').trim()
      const indexUpdates: Record<string, any> = {
        lastUpdated: now,
        uid: uid // Ensure uid is always set
      }

      // CRITICAL: Sync ALL profile fields to creators_index for Browse Coaches
      // This ensures any edit immediately appears in the Browse Coaches view
      if (body.displayName !== undefined) {
        indexUpdates.displayName = displayNameToSave
        indexUpdates.name = displayNameToSave // Also update 'name' field for consistency
      }
      if (body.bio !== undefined) {
        indexUpdates.bio = body.bio
        indexUpdates.description = body.bio // Also update description for compatibility
      }
      if (body.location !== undefined) {
        indexUpdates.location = body.location
      }
      if (body.sport !== undefined) {
        indexUpdates.sport = body.sport
      }
      if (body.profileImageUrl !== undefined) {
        // Mirror profile image to all common image fields for maximum compatibility
        indexUpdates.profileImageUrl = body.profileImageUrl
        indexUpdates.headshotUrl = body.profileImageUrl
        indexUpdates.photoURL = body.profileImageUrl
        indexUpdates.bannerUrl = body.profileImageUrl
        indexUpdates.heroImageUrl = body.profileImageUrl
        indexUpdates.coverImageUrl = body.profileImageUrl
      }
      if (body.showcasePhoto1 !== undefined) {
        indexUpdates.showcasePhoto1 = body.showcasePhoto1
      }
      if (body.showcasePhoto2 !== undefined) {
        indexUpdates.showcasePhoto2 = body.showcasePhoto2
      }
      if (body.galleryPhotos !== undefined) {
        indexUpdates.galleryPhotos = body.galleryPhotos
      }
      if (body.instagram !== undefined) {
        indexUpdates.instagram = body.instagram
      }
      if (body.facebook !== undefined) {
        indexUpdates.facebook = body.facebook
      }
      if (body.twitter !== undefined) {
        indexUpdates.twitter = body.twitter
      }
      if (body.linkedin !== undefined) {
        indexUpdates.linkedin = body.linkedin
      }
      if (body.youtube !== undefined) {
        indexUpdates.youtube = body.youtube
      }
      if (body.socialLinks !== undefined) {
        indexUpdates.socialLinks = body.socialLinks
      }

      console.log(`[COACH-PROFILE/SAVE] Syncing ALL profile fields to creators_index for ${uid}`)

      // Always update or create the document - don't skip if it doesn't exist
      if (creatorsDoc.exists) {
        await creatorsIndexRef.set(indexUpdates, { merge: true })
        console.log(`[COACH-PROFILE/SAVE] Updated existing creators_index for ${uid}`, indexUpdates)
      } else {
        // Create the document if it doesn't exist (shouldn't happen, but handle it)
        console.warn(`[COACH-PROFILE/SAVE] creators_index document does not exist for ${uid}, creating it`)
        await creatorsIndexRef.set({
          uid: uid,
          ...indexUpdates
        }, { merge: true })
        console.log(`[COACH-PROFILE/SAVE] Created creators_index for ${uid}`, indexUpdates)
      }
    } catch (visibilityError) {
      // CRITICAL: This is important for Browse Coaches visibility - log as error
      console.error('CRITICAL ERROR: failed to sync creators_index from coach-profile/save:', visibilityError)
      console.error('This means profile edits may not appear in Browse Coaches immediately!')
      // Don't throw - allow the save to succeed even if index update fails
      // But log it prominently so we know about the issue
      // TODO: Consider adding retry logic or queue for failed syncs
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


