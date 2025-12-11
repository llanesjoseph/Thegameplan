/**
 * Test Script for Invitation Email System
 * Run this script to send a test invitation to the super admin email
 *
 * Usage:
 *   node test-invitation-email.js
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const SUPER_ADMIN_EMAIL = 'joseph@crucibleanalytics.dev';

console.log('🧪 Athleap Invitation Email Test Script');
console.log('==========================================\n');

// Instructions for getting Firebase token
console.log('📋 INSTRUCTIONS:');
console.log('1. Open your browser and login to Athleap');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run this command:');
console.log('   firebase.auth().currentUser.getIdToken().then(t => console.log(t))');
console.log('5. Copy the long token that appears');
console.log('6. Run this script with the token:\n');
console.log('   FIREBASE_TOKEN="your-token-here" node test-invitation-email.js\n');
console.log('==========================================\n');

// Get token from environment
const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN;

if (!FIREBASE_TOKEN) {
  console.error('❌ ERROR: FIREBASE_TOKEN environment variable not set');
  console.log('\nPlease run:');
  console.log('  FIREBASE_TOKEN="your-token-here" node test-invitation-email.js\n');
  process.exit(1);
}

// Test data
const testInvitation = {
  coachId: '<YOUR_USER_ID>', // Will be extracted from token
  sport: 'Soccer',
  customMessage: '🧪 This is an AUTOMATED TEST invitation from the comprehensive audit. Please verify you received this email!',
  athletes: [
    {
      email: SUPER_ADMIN_EMAIL,
      name: 'Test Athlete - Audit Verification'
    }
  ]
};

console.log('📧 Sending test invitation...');
console.log(`To: ${SUPER_ADMIN_EMAIL}`);
console.log(`Sport: ${testInvitation.sport}`);
console.log(`Message: ${testInvitation.customMessage}\n`);

// Parse URL
const url = new URL('/api/coach/invite-athletes', BASE_URL);
const isHttps = url.protocol === 'https:';
const httpModule = isHttps ? https : require('http');

const postData = JSON.stringify(testInvitation);

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FIREBASE_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log(`🌐 Making request to: ${BASE_URL}${url.pathname}\n`);

const req = httpModule.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📡 Response Status: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ SUCCESS! Invitation sent successfully!\n');
        console.log('📊 Response:');
        console.log(JSON.stringify(response, null, 2));
        console.log('\n📬 CHECK YOUR EMAIL:');
        console.log(`   Login to: ${SUPER_ADMIN_EMAIL}`);
        console.log('   Subject: "🏆 You\'re Invited to Train with..."');
        console.log('   From: Athleap <noreply@mail.crucibleanalytics.dev>\n');

        if (response.results && response.results[0]) {
          const result = response.results[0];
          console.log('📝 Invitation Details:');
          console.log(`   Invitation ID: ${result.invitationId}`);
          console.log(`   Email ID: ${result.emailId || 'N/A'}`);
          console.log(`   Status: ${result.status}\n`);
        }

        console.log('✅ TEST PASSED: Email delivery initiated');
        console.log('⏱️  NEXT STEP: Check inbox within 5 seconds\n');
      } else if (res.statusCode === 401) {
        console.log('❌ AUTHENTICATION FAILED\n');
        console.log('Possible issues:');
        console.log('  - Token expired (tokens expire after 1 hour)');
        console.log('  - Invalid token');
        console.log('  - User not logged in\n');
        console.log('Solution: Get a fresh token from browser console\n');
        console.log(JSON.stringify(response, null, 2));
      } else if (res.statusCode === 403) {
        console.log('❌ PERMISSION DENIED\n');
        console.log('Your account does not have coach/creator role\n');
        console.log(JSON.stringify(response, null, 2));
      } else {
        console.log('❌ REQUEST FAILED\n');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (err) {
      console.log('❌ ERROR: Invalid JSON response');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ REQUEST ERROR:', err.message);
  console.log('\nPossible issues:');
  console.log('  - Server not running (run: npm run dev)');
  console.log('  - Wrong BASE_URL');
  console.log('  - Network issues\n');
});

req.write(postData);
req.end();
