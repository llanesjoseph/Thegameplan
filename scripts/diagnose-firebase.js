/**
 * DIAGNOSTIC SCRIPT - Find Firebase instances
 *
 * This will tell us what Firebase objects are available
 */

(async function() {
  console.log('🔍 FIREBASE DIAGNOSTICS')
  console.log('='.repeat(60))

  // Check window.__app
  console.log('window.__app:', window.__app)

  // Check window.firebase
  console.log('window.firebase:', window.firebase)

  // Check window.firebase.apps
  if (window.firebase && window.firebase.apps) {
    console.log('window.firebase.apps:', window.firebase.apps)
    console.log('window.firebase.apps.length:', window.firebase.apps.length)
  }

  // Check for auth in window
  console.log('window.auth:', window.auth)

  // Check for db in window
  console.log('window.db:', window.db)

  // List all window properties that might be Firebase-related
  console.log('\nSearching for Firebase-related properties on window...')
  const firebaseProps = Object.keys(window).filter(key =>
    key.toLowerCase().includes('firebase') ||
    key.toLowerCase().includes('auth') ||
    key.toLowerCase().includes('firestore') ||
    key === 'db' ||
    key.startsWith('__')
  )

  console.log('Found properties:', firebaseProps)

  console.log('\n='.repeat(60))
  console.log('Copy this output and share it!')
})();
