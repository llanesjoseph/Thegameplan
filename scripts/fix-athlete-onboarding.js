/**
 * Fix Athlete Onboarding Status
 *
 * This script checks and fixes the onboarding status for a specific athlete
 * Run in browser console while signed in
 */

(async function fixAthleteOnboarding() {
  console.log('🔧 Starting athlete onboarding fix...')

  try {
    // Get current user
    const user = window.firebase?.auth()?.currentUser
    if (!user) {
      console.error('❌ No user signed in. Please sign in first.')
      return
    }

    console.log('👤 Current user:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    })

    // Get Firestore reference
    const db = window.firebase?.firestore()
    if (!db) {
      console.error('❌ Firestore not available')
      return
    }

    // Check current user document
    const userRef = db.collection('users').doc(user.uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      console.error('❌ User document does not exist')
      return
    }

    const userData = userDoc.data()
    console.log('📋 Current user data:', {
      onboardingComplete: userData.onboardingComplete,
      displayName: userData.displayName,
      role: userData.role,
      hasAthleteProfile: !!userData.athleteProfile
    })

    // Check if onboarding needs to be fixed
    if (userData.onboardingComplete === true) {
      console.log('✅ Onboarding already marked as complete')

      // Set localStorage anyway
      localStorage.setItem(`onboarding_complete_${user.uid}`, 'true')
      console.log('💾 Saved to localStorage')

      console.log('🔄 Refresh the page to see the dashboard without the modal')
      return
    }

    // Fix the onboarding status
    console.log('🔧 Marking onboarding as complete...')
    await userRef.update({
      onboardingComplete: true,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    })

    // Set localStorage
    localStorage.setItem(`onboarding_complete_${user.uid}`, 'true')

    console.log('✅ Onboarding status fixed!')
    console.log('💾 Saved to localStorage')
    console.log('🔄 Refresh the page to see your dashboard')

  } catch (error) {
    console.error('❌ Error fixing onboarding:', error)
  }
})()
