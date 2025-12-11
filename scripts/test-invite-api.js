/**
 * Test the invite-athletes API directly
 * Run this in the browser console while signed in
 */

(async function testInviteAPI() {
  console.log('🧪 Testing invite-athletes API...')

  try {
    // Get current user and fresh token
    const user = window.firebase?.auth()?.currentUser
    if (!user) {
      console.error('❌ No user signed in')
      return
    }

    console.log('👤 User:', user.email, user.uid)

    // Force refresh the ID token
    console.log('🔄 Refreshing auth token...')
    const token = await user.getIdToken(true) // true = force refresh
    console.log('✅ Token refreshed')

    // Test API call
    console.log('📤 Sending test invitation request...')
    const response = await fetch('/api/coach/invite-athletes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        creatorUid: user.uid,
        sport: 'Soccer',
        customMessage: 'Test invitation',
        athletes: [{
          email: 'crucibleatete1@yahoo.com',
          name: 'tester2'
        }]
      })
    })

    console.log('📥 Response status:', response.status)

    const result = await response.json()
    console.log('📄 Response body:', result)

    if (response.ok) {
      console.log('✅ API call successful!')
    } else {
      console.error('❌ API call failed:', result)
    }

  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
})()
