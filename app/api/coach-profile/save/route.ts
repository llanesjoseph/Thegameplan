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

    // CRITICAL: Always save displayName if provided (even if empty string)
    // This ensures name changes are always persisted
    if (body.displayName !== undefined) {
      profileUpdates.displayName = body.displayName
      userUpdates.displayName = body.displayName
      console.log(`[COACH-PROFILE/SAVE] Saving displayName: "${body.displayName}"`)
    }
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
    assignIfDefined(userUpdates, 'displayName', body.displayName)
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

    const batch = db.batch()

    // Save to creator_profiles (primary collection)
    const creatorRef = db.collection('creator_profiles').doc(uid)
    batch.set(creatorRef, profileUpdates, { merge: true })

    // Also save to coach_profiles for consistency (some components load from both)
    const coachRef = db.collection('coach_profiles').doc(uid)
    batch.set(coachRef, profileUpdates, { merge: true })

    // Mirror key fields to users collection for backward compatibility
    const userRef = db.collection('users').doc(uid)
    if (Object.keys(userUpdates).length > 0) {
      batch.set(userRef, userUpdates, { merge: true })
    }

    await batch.commit()
    
    // Log successful save for debugging
    console.log(`[COACH-PROFILE/SAVE] Successfully saved profile for ${uid}`, {
      displayName: body.displayName,
      hasProfileUpdates: Object.keys(profileUpdates).length > 0,
      hasUserUpdates: Object.keys(userUpdates).length > 0
    })

    // Keep creators_index (Browse Coaches) in sync so headshots and key fields
    // update everywhere. We only touch it if it already exists – creation is
    // handled elsewhere (ensureCoachVisibility during onboarding/approval).
    try {
      const creatorsIndexRef = db.collection('creators_index').doc(uid)
      const creatorsDoc = await creatorsIndexRef.get()

      if (creatorsDoc.exists) {
        const indexUpdates: Record<string, any> = {
          lastUpdated: now
        }

        // If a new profile image was set, mirror it into all common image fields
        // used by public views so the Browse Coaches grid always shows the latest headshot.
        if (body.profileImageUrl) {
          indexUpdates.profileImageUrl = body.profileImageUrl
          indexUpdates.headshotUrl = body.profileImageUrl
          indexUpdates.photoURL = body.profileImageUrl
          indexUpdates.bannerUrl = body.profileImageUrl
          indexUpdates.heroImageUrl = body.profileImageUrl
          indexUpdates.coverImageUrl = body.profileImageUrl
        }

        // Keep key identity fields aligned when they are updated.
        if (body.displayName !== undefined) {
          indexUpdates.displayName = body.displayName
          indexUpdates.name = body.displayName // Also update 'name' field for consistency
        }
        if (body.sport !== undefined) {
          indexUpdates.sport = body.sport
        }

        await creatorsIndexRef.set(indexUpdates, { merge: true })
      }
    } catch (visibilityError) {
      // Do not fail the profile save if the public index sync fails; just log.
      console.warn('Warning: failed to sync creators_index from coach-profile/save:', visibilityError)
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


