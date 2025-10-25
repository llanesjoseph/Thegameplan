/**
 * Direct API test for /api/submissions endpoint
 * Run this with: node test-submissions-api.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function testSubmissionsAPI() {
  try {
    console.log('🧪 Testing /api/submissions endpoint...\n');
    
    // Find an athlete user to test with
    console.log('📋 Finding an athlete user...');
    const listUsersResult = await auth.listUsers(100);
    const athleteUser = listUsersResult.users.find(u => u.email && u.email.includes('athlete'));
    
    if (!athleteUser) {
      console.error('❌ No athlete user found in Firebase Auth');
      console.log('💡 Create an athlete user first or use the invitation system');
      return;
    }
    
    console.log(`✅ Found athlete: ${athleteUser.email} (${athleteUser.uid})\n`);
    
    // Generate a custom token for this user
    console.log('🔑 Generating custom token...');
    const customToken = await auth.createCustomToken(athleteUser.uid);
    console.log('✅ Token generated\n');
    
    // Exchange custom token for ID token (simulating browser login)
    console.log('🔐 Exchanging for ID token...');
    const idTokenResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    
    if (!idTokenResponse.ok) {
      console.error('❌ Failed to exchange token:', await idTokenResponse.text());
      return;
    }
    
    const { idToken } = await idTokenResponse.json();
    console.log('✅ ID token obtained\n');
    
    // Test the API endpoint
    console.log('🚀 Calling /api/submissions...');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/submissions?athleteUid=${athleteUser.uid}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Success!');
      console.log(`📦 Submissions found: ${data.submissions?.length || 0}`);
      console.log('\n📄 Response data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSubmissionsAPI();

