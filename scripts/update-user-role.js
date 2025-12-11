/**
 * Quick script to update user role to 'creator' for dashboard access
 * Run this in the browser console on your site
 */

// Function to update user role to creator
async function updateUserToCreator() {
  try {
    // Get current user
    const user = window.auth?.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return false
    }

    console.log('Current user:', user.uid, user.email)

    // Update user document
    const userDocRef = window.db.collection('users').doc(user.uid)

    await userDocRef.update({
      role: 'creator',
      roleUpdatedAt: new Date(),
      roleUpdateReason: 'Manual update for dashboard access'
    })

    console.log('✅ Successfully updated user role to creator')
    console.log('🔄 Please refresh the page to see changes')

    return true
  } catch (error) {
    console.error('❌ Failed to update user role:', error)
    return false
  }
}

// Auto-run the function
console.log('🚀 Updating user role to creator...')
updateUserToCreator()