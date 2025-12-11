/**
 * Test script for Coach Email Notification System
 *
 * This script tests the various coach notification scenarios:
 * 1. Coach sends invitations and receives confirmation
 * 2. Athlete accepts invitation and coach gets notified
 * 3. Athlete declines invitation and coach gets notified
 * 4. Invitation expires and coach gets notified
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

// Test data
const TEST_COACH = {
  id: 'test-coach-123',
  email: 'test.coach@example.com',
  name: 'John Coach'
}

const TEST_ATHLETES = [
  {
    email: 'athlete1@test.com',
    name: 'Sarah Johnson'
  },
  {
    email: 'athlete2@test.com',
    name: 'Mike Wilson'
  }
]

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testSendInvitations() {
  log('\n=== TEST 1: Sending Athlete Invitations ===', 'cyan')

  try {
    const response = await fetch(`${BASE_URL}/api/coach/invite-athletes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coachId: TEST_COACH.id,
        sport: 'Soccer',
        customMessage: 'Welcome to our elite soccer training program!',
        athletes: TEST_ATHLETES
      })
    })

    const result = await response.json()

    if (result.success) {
      log(`✅ Successfully sent ${result.successCount} invitations`, 'green')
      log(`📧 Coach should receive confirmation email at: ${TEST_COACH.email}`, 'yellow')

      // Return invitation IDs for further testing
      return result.results.map(r => r.invitationId).filter(Boolean)
    } else {
      log(`❌ Failed to send invitations: ${result.error}`, 'red')
      return []
    }
  } catch (error) {
    log(`❌ Error sending invitations: ${error.message}`, 'red')
    return []
  }
}

async function testAcceptInvitation(invitationId) {
  log('\n=== TEST 2: Athlete Accepts Invitation ===', 'cyan')

  try {
    // First validate the invitation
    const validateResponse = await fetch(`${BASE_URL}/api/validate-invitation?id=${invitationId}&type=athlete`)
    const validateResult = await validateResponse.json()

    if (!validateResult.success) {
      log(`❌ Invalid invitation: ${invitationId}`, 'red')
      return false
    }

    // Submit athlete application (simulating acceptance)
    const response = await fetch(`${BASE_URL}/api/submit-athlete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitationId,
        userInfo: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: TEST_ATHLETES[0].email,
          phone: '555-1234'
        },
        athleteData: {
          dateOfBirth: '2005-01-15',
          experience: 'Played varsity for 3 years',
          goals: 'Improve technical skills and fitness',
          medicalConditions: 'None',
          emergencyContact: 'Parent Name',
          emergencyPhone: '555-5678'
        }
      })
    })

    const result = await response.json()

    if (result.success) {
      log(`✅ Athlete accepted invitation successfully`, 'green')
      log(`📧 Coach should receive acceptance notification at: ${TEST_COACH.email}`, 'yellow')
      return true
    } else {
      log(`❌ Failed to accept invitation: ${result.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Error accepting invitation: ${error.message}`, 'red')
    return false
  }
}

async function testDeclineInvitation(invitationId) {
  log('\n=== TEST 3: Athlete Declines Invitation ===', 'cyan')

  try {
    const response = await fetch(`${BASE_URL}/api/invitation-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitationId,
        status: 'declined',
        athleteInfo: TEST_ATHLETES[1]
      })
    })

    const result = await response.json()

    if (result.success) {
      log(`✅ Invitation declined successfully`, 'green')
      log(`📧 Coach should receive decline notification at: ${TEST_COACH.email}`, 'yellow')
      return true
    } else {
      log(`❌ Failed to decline invitation: ${result.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Error declining invitation: ${error.message}`, 'red')
    return false
  }
}

async function testExpiredInvitations() {
  log('\n=== TEST 4: Check Expired Invitations ===', 'cyan')

  try {
    const response = await fetch(`${BASE_URL}/api/invitation-status`, {
      method: 'GET'
    })

    const result = await response.json()

    if (result.success) {
      log(`✅ Checked for expired invitations: ${result.message}`, 'green')
      if (result.results.length > 0) {
        log(`📧 Coaches should receive expiry notifications for ${result.results.length} invitations`, 'yellow')
      } else {
        log(`ℹ️ No expired invitations found`, 'blue')
      }
      return true
    } else {
      log(`❌ Failed to check expired invitations: ${result.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Error checking expired invitations: ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('\n====================================', 'cyan')
  log('COACH EMAIL NOTIFICATION SYSTEM TEST', 'cyan')
  log('====================================', 'cyan')

  log('\nStarting test suite...', 'yellow')
  log('Note: Make sure your development server is running on ' + BASE_URL, 'yellow')

  // Test 1: Send invitations
  const invitationIds = await testSendInvitations()

  if (invitationIds.length === 0) {
    log('\n⚠️ No invitations were sent, skipping remaining tests', 'yellow')
    return
  }

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 2: Accept first invitation
  if (invitationIds[0]) {
    await testAcceptInvitation(invitationIds[0])
  }

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 3: Decline second invitation
  if (invitationIds[1]) {
    await testDeclineInvitation(invitationIds[1])
  }

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 4: Check for expired invitations
  await testExpiredInvitations()

  log('\n====================================', 'cyan')
  log('TEST SUITE COMPLETED', 'cyan')
  log('====================================', 'cyan')

  log('\nIMPORTANT NOTES:', 'yellow')
  log('1. Check the console logs for email send confirmations', 'yellow')
  log('2. In production, actual emails will be sent via Resend', 'yellow')
  log('3. Make sure RESEND_API_KEY is configured in your .env file', 'yellow')
  log('4. Coach email notifications include:', 'yellow')
  log('   - Invitation sent confirmation', 'blue')
  log('   - Athlete acceptance notification', 'blue')
  log('   - Athlete decline notification', 'blue')
  log('   - Invitation expiry notification', 'blue')
}

// Run the tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red')
  process.exit(1)
})