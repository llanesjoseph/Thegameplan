import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { syncCoachToBrowseCoaches } from '@/lib/sync-coach-to-browse'

export const runtime = 'nodejs'

/**
 * POST /api/admin/fix-joseph-visibility
 * Admin endpoint to fix Joseph's profile visibility in Browse Coaches
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [FIX-JOSEPH-VISIBILITY] Starting...')
    
    // Find Joseph's user document
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', 'llanes.joseph.m@gmail.com')
      .limit(1)
      .get()
    
    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Joseph\'s user document not found' },
        { status: 404 }
      )
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    const uid = userDoc.id
    
    console.log(`✅ Found Joseph: ${userData.displayName} (${uid})`)
    
    // Get full profile from creator_profiles
    const creatorRef = adminDb.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    let profileData: any = {}
    if (creatorDoc.exists) {
      profileData = creatorDoc.data() || {}
      console.log('✅ Found creator_profiles data')
    }
    
    // Merge with user data and ensure visibility fields
    const fullProfile = {
      uid,
      email: userData.email?.toLowerCase() || '',
      displayName: userData.displayName || profileData.displayName || 'Joseph Llanes',
      firstName: userData.firstName || profileData.firstName || '',
      lastName: userData.lastName || profileData.lastName || '',
      sport: userData.sport || profileData.sport || 'BJJ',
      location: userData.location || profileData.location || '',
      bio: userData.bio || profileData.bio || '',
      tagline: userData.tagline || profileData.tagline || '',
      profileImageUrl: userData.profileImageUrl || profileData.profileImageUrl || userData.photoURL || '',
      headshotUrl: profileData.headshotUrl || userData.profileImageUrl || userData.photoURL || '',
      heroImageUrl: profileData.heroImageUrl || '',
      showcasePhoto1: profileData.showcasePhoto1 || '',
      showcasePhoto2: profileData.showcasePhoto2 || '',
      galleryPhotos: profileData.galleryPhotos || [],
      instagram: userData.instagram || profileData.instagram || '',
      facebook: userData.facebook || profileData.facebook || '',
      twitter: userData.twitter || profileData.twitter || '',
      linkedin: userData.linkedin || profileData.linkedin || '',
      youtube: userData.youtube || profileData.youtube || '',
      // CRITICAL: Set visibility fields
      isActive: true,
      profileComplete: true,
      status: 'approved',
      verified: true,
      featured: false
    }
    
    // Use centralized sync function
    const syncResult = await syncCoachToBrowseCoaches(uid, fullProfile)
    
    if (!syncResult.success) {
      return NextResponse.json(
        { error: `Failed to sync: ${syncResult.error}` },
        { status: 500 }
      )
    }
    
    // Verify it's visible
    const creatorsIndexRef = adminDb.collection('creators_index').doc(uid)
    const verifyDoc = await creatorsIndexRef.get()
    
    if (!verifyDoc.exists) {
      return NextResponse.json(
        { error: 'Profile synced but not found in creators_index' },
        { status: 500 }
      )
    }
    
    const verifyData = verifyDoc.data()
    const isVisible = verifyData?.isActive === true && 
                     verifyData?.profileComplete === true && 
                     (verifyData?.status === 'approved' || !verifyData?.status)
    
    return NextResponse.json({
      success: true,
      message: isVisible 
        ? 'Joseph\'s profile is now visible in Browse Coaches!' 
        : 'Joseph\'s profile was synced but may not be visible',
      data: {
        uid,
        displayName: fullProfile.displayName,
        isVisible,
        profileData: {
          isActive: verifyData?.isActive,
          profileComplete: verifyData?.profileComplete,
          status: verifyData?.status
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ [FIX-JOSEPH-VISIBILITY] Error:', error)
    return NextResponse.json(
      { error: `Failed: ${error.message}` },
      { status: 500 }
    )
  }
}

