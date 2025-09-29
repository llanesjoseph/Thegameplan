/**
 * Script to fix Joseph's user role from creator to coach
 * Run this once to fix the role discrepancy
 */

const JOSEPH_EMAIL = 'llanes.joseph.m@gmail.com'
const NEW_ROLE = 'coach'
const REASON = 'Correcting role discrepancy - Joseph is a coach, not creator'

async function fixJosephRole() {
  try {
    console.log('🔧 Fixing Joseph\'s user role...')

    const response = await fetch('http://localhost:3001/api/admin/fix-user-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This would need proper admin authentication in production
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      },
      body: JSON.stringify({
        userEmail: JOSEPH_EMAIL,
        newRole: NEW_ROLE,
        reason: REASON
      })
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ SUCCESS:', result.message)
      console.log('📊 Details:', result.data)
    } else {
      console.error('❌ ERROR:', result.error)
    }

  } catch (error) {
    console.error('❌ SCRIPT ERROR:', error.message)
  }
}

// Uncomment to run (need admin token)
// fixJosephRole()

console.log(`
🎯 JOSEPH ROLE FIX SCRIPT

To fix Joseph's role:
1. Get admin authentication token
2. Replace YOUR_ADMIN_TOKEN_HERE with actual token
3. Uncomment the fixJosephRole() call
4. Run: node scripts/fix-joseph-role.js

Target: ${JOSEPH_EMAIL}
Change: creator → ${NEW_ROLE}
Reason: ${REASON}
`)