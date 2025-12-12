import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'
import { createSlugMapping } from '@/lib/slug-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * AGGRESSIVE FIX: Force sync Joseph's profile everywhere
 * This ensures Joseph appears in:
 * - Admin panel (creators_index)
 * - Browse Coaches (creators_index)
 * - Coach profile API (creators_index + slug mapping)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚨 AGGRESSIVE FIX: Starting comprehensive Joseph profile sync...')
    
    const JOSEPH_UID = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2'
    const JOSEPH_EMAIL = 'llanes.joseph.m@gmail.com'
    
    // Step 1: Get Joseph's data from all collections
    console.log('📖 Step 1: Reading Joseph\'s data from all collections...')
    
    const [userDoc, creatorDoc, coachDoc] = await Promise.all([
      db.collection('users').doc(JOSEPH_UID).get(),
      db.collection('creator_profiles').doc(JOSEPH_UID).get(),
      db.collection('coach_profiles').doc(JOSEPH_UID).get()
    ])
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Joseph\'s user document not found' },
        { status: 404 }
      )
    }
    
    const userData = userDoc.data() || {}
    const creatorData = creatorDoc.exists ? (creatorDoc.data() || {}) : {}
    const coachData = coachDoc.exists ? (coachDoc.data() || {}) : {}
    
    console.log('✅ Found Joseph\'s data in:', {
      users: userDoc.exists,
      creator_profiles: creatorDoc.exists,
      coach_profiles: coachDoc.exists
    })
    
    // Step 2: Merge all data sources
    const fullProfile = {
      uid: JOSEPH_UID,
      email: userData.email || JOSEPH_EMAIL,
      displayName: userData.displayName || creatorData.displayName || 'Joseph Llanes',
      firstName: userData.firstName || creatorData.firstName || 'Joseph',
      lastName: userData.lastName || creatorData.lastName || 'Llanes',
      sport: userData.sport || creatorData.sport || coachData.sport || 'BJJ',
      location: userData.location || creatorData.location || coachData.location || 'San Francisco',
      bio: userData.bio || creatorData.bio || coachData.bio || '',
      tagline: userData.tagline || creatorData.tagline || coachData.tagline || '',
      credentials: userData.credentials || creatorData.credentials || coachData.credentials || '',
      experience: userData.experience || creatorData.experience || coachData.experience || '',
      specialties: userData.specialties || creatorData.specialties || coachData.specialties || [],
      achievements: userData.achievements || creatorData.achievements || coachData.achievements || [],
      profileImageUrl: userData.profileImageUrl || creatorData.profileImageUrl || coachData.profileImageUrl || userData.photoURL || '',
      headshotUrl: creatorData.headshotUrl || coachData.headshotUrl || userData.profileImageUrl || userData.photoURL || '',
      heroImageUrl: creatorData.heroImageUrl || coachData.heroImageUrl || '',
      showcasePhoto1: creatorData.showcasePhoto1 || coachData.showcasePhoto1 || userData.showcasePhoto1 || '',
      showcasePhoto2: creatorData.showcasePhoto2 || coachData.showcasePhoto2 || userData.showcasePhoto2 || '',
      galleryPhotos: creatorData.galleryPhotos || coachData.galleryPhotos || userData.galleryPhotos || [],
      instagram: userData.instagram || creatorData.instagram || coachData.instagram || '',
      facebook: userData.facebook || creatorData.facebook || coachData.facebook || '',
      twitter: userData.twitter || creatorData.twitter || coachData.twitter || '',
      linkedin: userData.linkedin || creatorData.linkedin || coachData.linkedin || '',
      youtube: userData.youtube || creatorData.youtube || coachData.youtube || '',
      // CRITICAL: Set visibility fields
      isActive: true,
      profileComplete: true,
      status: 'approved',
      verified: true,
      featured: false,
      role: 'coach'
    }
    
    console.log('✅ Merged profile data:', {
      displayName: fullProfile.displayName,
      sport: fullProfile.sport,
      email: fullProfile.email
    })
    
    // Step 3: Update users collection
    console.log('📝 Step 3: Updating users collection...')
    await db.collection('users').doc(JOSEPH_UID).set({
      ...fullProfile,
      role: 'coach',
      updatedAt: new Date()
    }, { merge: true })
    console.log('✅ Updated users collection')
    
    // Step 4: Update creator_profiles collection
    console.log('📝 Step 4: Updating creator_profiles collection...')
    await db.collection('creator_profiles').doc(JOSEPH_UID).set({
      ...fullProfile,
      updatedAt: new Date()
    }, { merge: true })
    console.log('✅ Updated creator_profiles collection')
    
    // Step 5: Update coach_profiles collection
    console.log('📝 Step 5: Updating coach_profiles collection...')
    await db.collection('coach_profiles').doc(JOSEPH_UID).set({
      ...fullProfile,
      updatedAt: new Date()
    }, { merge: true })
    console.log('✅ Updated coach_profiles collection')
    
    // Step 6: Sync to creators_index (for admin panel and Browse Coaches)
    console.log('📝 Step 6: Syncing to creators_index...')
    const syncResult = await syncCoachToBrowseCoaches(JOSEPH_UID, fullProfile)
    
    if (!syncResult.success) {
      console.error('❌ Failed to sync to creators_index:', syncResult.error)
      return NextResponse.json(
        { error: `Failed to sync to creators_index: ${syncResult.error}` },
        { status: 500 }
      )
    }
    console.log('✅ Synced to creators_index')
    
    // Step 7: Create/update slug mapping (for coach profile API)
    console.log('📝 Step 7: Creating slug mapping...')
    const slugResult = await createSlugMapping(JOSEPH_UID, fullProfile.displayName)
    
    if (!slugResult.success) {
      console.error('❌ Failed to create slug mapping:', slugResult.error)
      return NextResponse.json(
        { error: `Failed to create slug mapping: ${slugResult.error}` },
        { status: 500 }
      )
    }
    
    const slug = slugResult.slug
    console.log(`✅ Created/updated slug mapping: ${slug}`)
    
    // Step 8: Verify everything is in place
    console.log('🔍 Step 8: Verifying all collections...')
    const [verifyUser, verifyCreator, verifyIndex, verifySlug] = await Promise.all([
      db.collection('users').doc(JOSEPH_UID).get(),
      db.collection('creator_profiles').doc(JOSEPH_UID).get(),
      db.collection('creators_index').doc(JOSEPH_UID).get(),
      db.collection('slug_mappings').doc(slug).get()
    ])
    
    const verification = {
      users: verifyUser.exists,
      creator_profiles: verifyCreator.exists,
      creators_index: verifyIndex.exists,
      slug_mapping: verifySlug.exists,
      creators_index_data: verifyIndex.exists ? verifyIndex.data() : null
    }
    
    console.log('✅ Verification complete:', verification)
    
    const isVisible = verification.creators_index && 
                     verification.creators_index_data?.isActive === true &&
                     verification.creators_index_data?.profileComplete === true &&
                     (verification.creators_index_data?.status === 'approved' || !verification.creators_index_data?.status)
    
    return NextResponse.json({
      success: true,
      message: isVisible 
        ? 'Joseph\'s profile is now fully synced and visible everywhere!' 
        : 'Joseph\'s profile was synced but may need additional fixes',
      data: {
        uid: JOSEPH_UID,
        displayName: fullProfile.displayName,
        slug: slug,
        isVisible,
        verification
      }
    })
    
  } catch (error: any) {
    console.error('❌ AGGRESSIVE FIX ERROR:', error)
    return NextResponse.json(
      { error: `Failed: ${error.message}`, stack: error.stack },
      { status: 500 }
    )
  }
}

