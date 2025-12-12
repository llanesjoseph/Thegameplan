/**
 * Fix Joseph's profile visibility in Browse Coaches
 * Ensures Joseph's profile is synced to creators_index with all required fields
 */

const admin = require('firebase-admin')
const serviceAccount = require('../firebase-service-account.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function fixJosephVisibility() {
  try {
    console.log('🔧 Fixing Joseph\'s profile visibility...')
    
    // Find Joseph's user document
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'llanes.joseph.m@gmail.com')
      .limit(1)
      .get()
    
    if (usersSnapshot.empty) {
      console.error('❌ Joseph\'s user document not found')
      return
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    const uid = userDoc.id
    
    console.log(`✅ Found Joseph: ${userData.displayName} (${uid})`)
    
    // Get full profile from creator_profiles
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    let profileData = {}
    if (creatorDoc.exists) {
      profileData = creatorDoc.data() || {}
      console.log('✅ Found creator_profiles data')
    }
    
    // Merge with user data
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
      featured: false,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    // Sync to creators_index
    const creatorsIndexRef = db.collection('creators_index').doc(uid)
    await creatorsIndexRef.set(fullProfile, { merge: true })
    
    console.log('✅ Joseph\'s profile synced to creators_index')
    console.log('📊 Profile data:', {
      displayName: fullProfile.displayName,
      sport: fullProfile.sport,
      isActive: fullProfile.isActive,
      profileComplete: fullProfile.profileComplete,
      status: fullProfile.status
    })
    
    // Verify it's visible
    const verifyDoc = await creatorsIndexRef.get()
    if (verifyDoc.exists) {
      const verifyData = verifyDoc.data()
      const isVisible = verifyData.isActive === true && 
                       verifyData.profileComplete === true && 
                       (verifyData.status === 'approved' || !verifyData.status)
      
      if (isVisible) {
        console.log('✅ Joseph\'s profile is now visible in Browse Coaches!')
      } else {
        console.error('❌ Joseph\'s profile exists but is not visible:', {
          isActive: verifyData.isActive,
          profileComplete: verifyData.profileComplete,
          status: verifyData.status
        })
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing Joseph\'s visibility:', error)
    process.exit(1)
  }
}

fixJosephVisibility()

