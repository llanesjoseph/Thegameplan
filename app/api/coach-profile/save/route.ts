import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb as db } from '@/lib/firebase.admin'
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
    console.log('[COACH-PROFILE/SAVE] ========== SAVE REQUEST RECEIVED ==========')
    
    // EXTRA PRECISION: Validate request method
    if (request.method !== 'POST') {
      console.error('[COACH-PROFILE/SAVE] Invalid method:', request.method)
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }
    
    // EXTRA PRECISION: SIMPLE AUTH with detailed logging
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[COACH-PROFILE/SAVE] ❌ No authorization header')
      return NextResponse.json({ error: 'Unauthorized: Missing authentication token' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    if (!token || token.trim().length === 0) {
      console.error('[COACH-PROFILE/SAVE] ❌ Empty token')
      return NextResponse.json({ error: 'Unauthorized: Invalid token format' }, { status: 401 })
    }

    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
      console.log(`[COACH-PROFILE/SAVE] ✅ Token verified for user: ${decodedToken.uid}`)
    } catch (error: any) {
      console.error('[COACH-PROFILE/SAVE] ❌ Token verification failed:', {
        error: error.message,
        code: error.code,
        uid: decodedToken?.uid || 'UNKNOWN'
      })
      return NextResponse.json({ 
        error: 'Invalid token. Please sign out and sign back in.',
        code: error.code || 'TOKEN_VERIFICATION_FAILED'
      }, { status: 401 })
    }

    const uid = decodedToken.uid
    if (!uid || uid.trim().length === 0) {
      console.error('[COACH-PROFILE/SAVE] ❌ Invalid UID from token')
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 })
    }
    
    // EXTRA PRECISION: Check user exists and get role
    let userDoc
    try {
      userDoc = await db.collection('users').doc(uid).get()
    } catch (error: any) {
      console.error('[COACH-PROFILE/SAVE] ❌ Error fetching user document:', error.message)
      return NextResponse.json({ error: 'Database error: Failed to fetch user' }, { status: 500 })
    }

    if (!userDoc.exists) {
      console.error(`[COACH-PROFILE/SAVE] ❌ User document not found: ${uid}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const userData = userDoc.data()
    if (!userData) {
      console.error(`[COACH-PROFILE/SAVE] ❌ User document exists but has no data: ${uid}`)
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    const userRole = userData?.role || 'user'
    const validRoles = ['coach', 'creator', 'admin', 'superadmin']
    
    if (!validRoles.includes(userRole)) {
      console.error(`[COACH-PROFILE/SAVE] ❌ Invalid role: ${userRole} for user ${uid}`)
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only coaches can save profiles.',
        role: userRole
      }, { status: 403 })
    }

    console.log(`[COACH-PROFILE/SAVE] ✅ Authentication successful for user ${uid} (role: ${userRole})`)

    // EXTRA PRECISION: Parse and validate request body
    let body: CoachProfileUpdateBody
    try {
      body = await request.json() as CoachProfileUpdateBody
      console.log(`[COACH-PROFILE/SAVE] ✅ Request body parsed successfully`)
    } catch (error: any) {
      console.error('[COACH-PROFILE/SAVE] ❌ Failed to parse request body:', error.message)
      return NextResponse.json({ error: 'Invalid request body. Please check your data.' }, { status: 400 })
    }

    // EXTRA PRECISION: Validate body structure
    if (!body || typeof body !== 'object') {
      console.error('[COACH-PROFILE/SAVE] ❌ Invalid body type:', typeof body)
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 })
    }

    // Basic guard – nothing to update
    if (Object.keys(body).length === 0) {
      console.error('[COACH-PROFILE/SAVE] ❌ Empty body - no fields to update')
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 })
    }

    const now = new Date()

    // Build a sanitized update object (strip undefined)
    const profileUpdates: Record<string, any> = {}
    const userUpdates: Record<string, any> = {}

    const assignIfDefined = (target: Record<string, any>, key: string, value: any) => {
      // Allow empty strings, null, and defined values - only skip undefined
      if (value !== undefined) {
        // Convert null to empty string for consistency
        target[key] = value === null ? '' : value
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

    // EXTRA PRECISION: Validate we have updates before creating batch
    if (Object.keys(profileUpdates).length === 0 && Object.keys(userUpdates).length === 0) {
      console.error('[COACH-PROFILE/SAVE] ❌ No updates to save after processing body')
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // EXTRA PRECISION: Create batch with error handling
    const batch = db.batch()

    try {
      // Save to creator_profiles (primary collection)
      batch.set(creatorRef, profileUpdates, { merge: true })
      console.log(`[COACH-PROFILE/SAVE] ✅ Added creator_profiles update to batch (${Object.keys(profileUpdates).length} fields)`)

      // Also save to coach_profiles for consistency (some components load from both)
      const coachRef = db.collection('coach_profiles').doc(uid)
      batch.set(coachRef, profileUpdates, { merge: true })
      console.log(`[COACH-PROFILE/SAVE] ✅ Added coach_profiles update to batch`)

      // Mirror key fields to users collection for backward compatibility
      const userRef = db.collection('users').doc(uid)
      if (Object.keys(userUpdates).length > 0) {
        batch.set(userRef, userUpdates, { merge: true })
        console.log(`[COACH-PROFILE/SAVE] ✅ Added users update to batch (${Object.keys(userUpdates).length} fields)`)
      }

      // EXTRA PRECISION: Commit the batch write with error handling
      await batch.commit()
      console.log(`[COACH-PROFILE/SAVE] ✅ Batch committed successfully for ${uid}`)
    } catch (batchError: any) {
      console.error(`[COACH-PROFILE/SAVE] ❌ Batch write failed:`, {
        error: batchError.message,
        code: batchError.code,
        uid: uid
      })
      throw new Error(`Failed to save profile: ${batchError.message}`)
    }
    
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
    
    // EXTRA PRECISION: Update creator_profiles with visibility fields BEFORE sync
    try {
      await creatorRef.set({
        isActive: visibilityData.isActive,
        profileComplete: visibilityData.profileComplete,
        status: visibilityData.status
      }, { merge: true })
      
      console.log(`[COACH-PROFILE/SAVE] ✅ Set visibility fields to visible:`, {
        isActive: visibilityData.isActive,
        profileComplete: visibilityData.profileComplete,
        status: visibilityData.status
      })
    } catch (visibilityError: any) {
      console.error(`[COACH-PROFILE/SAVE] ❌ Failed to set visibility fields:`, visibilityError.message)
      // Don't fail the request, but log prominently
    }
    
    // IRONCLAD: Log ALL critical fields being synced for verification
    console.log(`[COACH-PROFILE/SAVE] IRONCLAD SYNC: All critical fields being synced:`, {
      displayName: profileUpdates.displayName || 'EMPTY',
      bio: profileUpdates.bio ? `${profileUpdates.bio.substring(0, 50)}...` : 'EMPTY',
      profileImageUrl: profileUpdates.profileImageUrl ? 'SET' : 'EMPTY',
      showcasePhoto1: profileUpdates.showcasePhoto1 ? 'SET' : 'EMPTY',
      showcasePhoto2: profileUpdates.showcasePhoto2 ? 'SET' : 'EMPTY',
      galleryPhotos: Array.isArray(profileUpdates.galleryPhotos) ? `${profileUpdates.galleryPhotos.length} photos` : 'EMPTY',
      instagram: profileUpdates.instagram || 'EMPTY',
      facebook: profileUpdates.facebook || 'EMPTY',
      twitter: profileUpdates.twitter || 'EMPTY',
      linkedin: profileUpdates.linkedin || 'EMPTY',
      youtube: profileUpdates.youtube || 'EMPTY'
    })
    
    // EXTRA PRECISION: Sync to Browse Coaches with error handling
    try {
      const syncResult = await syncCoachToBrowseCoaches(uid, visibilityData)
      
      if (!syncResult.success) {
        console.error(`❌ [COACH-PROFILE/SAVE] CRITICAL: Failed to sync to Browse Coaches: ${syncResult.error}`)
        console.error(`   This means profile edits may not appear in Browse Coaches immediately!`)
        // Don't fail the request, but log prominently
      } else {
        console.log(`✅ [COACH-PROFILE/SAVE] Successfully synced ALL profile fields to Browse Coaches for ${uid}`)
      }
    } catch (syncError: any) {
      console.error(`❌ [COACH-PROFILE/SAVE] Sync error (non-fatal):`, syncError.message)
      // Don't fail the request - profile is saved, sync can retry later
    }

    console.log(`[COACH-PROFILE/SAVE] ========== SAVE SUCCESSFUL ==========`)
    return NextResponse.json({ 
      success: true,
      message: 'Profile saved successfully',
      uid: uid
    })
  } catch (error: any) {
    console.error('[COACH-PROFILE/SAVE] ========== SAVE FAILED ==========')
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    })
    
    // EXTRA PRECISION: Return detailed error information
    return NextResponse.json(
      { 
        error: error.message || 'Failed to save profile',
        code: error.code || 'UNKNOWN_ERROR',
        success: false
      },
      { status: error.status || 500 }
    )
  }
}


