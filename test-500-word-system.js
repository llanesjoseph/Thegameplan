const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log('🧪 TESTING 500-WORD RESPONSE SYSTEM: Verifying intelligent truncation and follow-up suggestions\n');

async function test500WordSystem() {
  try {
    // Test with a question that should generate a long response
    const testQuestion = "Can you provide a comprehensive guide on improving soccer passing skills, including technical details, common mistakes, practice drills, and progression tips for different skill levels?";
    
    console.log('📝 Test Question:', testQuestion);
    console.log('📏 Question length:', testQuestion.length, 'characters\n');
    
    // Make API call to test the response length
    const response = await fetch('http://localhost:3000/api/ai-coaching', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will be handled by the API
      },
      body: JSON.stringify({
        question: testQuestion,
        userId: 'test-user',
        creatorId: 'test-coach',
        creatorName: 'Test Coach',
        sport: 'Soccer'
      })
    });
    
    if (!response.ok) {
      console.log('❌ API call failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.response) {
      console.log('✅ AI Response received successfully!');
      console.log('📏 Response length:', data.response.length, 'characters');
      console.log('📊 Response word count:', data.response.split(' ').length, 'words');
      
      // Check if response has follow-up suggestions
      const hasFollowUps = data.response.includes('Want to dive deeper?');
      const hasNumberedSuggestions = /\d+\. \*\*/.test(data.response);
      
      console.log('\n📋 Response Analysis:');
      console.log('   Has follow-up suggestions:', hasFollowUps ? '✅' : '❌');
      console.log('   Has numbered suggestions:', hasNumberedSuggestions ? '✅' : '❌');
      console.log('   Word count under 500:', data.response.split(' ').length <= 500 ? '✅' : '❌');
      
      // Show the follow-up section if it exists
      if (hasFollowUps) {
        const followUpStart = data.response.indexOf('Want to dive deeper?');
        const followUpSection = data.response.substring(followUpStart);
        console.log('\n🎯 Follow-up Suggestions:');
        console.log(followUpSection);
      }
      
      // Show first 300 characters of the main response
      const mainResponse = data.response.split('Want to dive deeper?')[0].trim();
      console.log('\n📖 Main Response Preview (first 300 chars):');
      console.log(mainResponse.substring(0, 300) + '...');
      
      // Analyze the system
      if (data.response.split(' ').length <= 500 && hasFollowUps) {
        console.log('\n✅ SYSTEM WORKING PERFECTLY!');
        console.log('   - Response is under 500 words');
        console.log('   - Follow-up suggestions are present');
        console.log('   - Engagement system is active');
      } else if (data.response.split(' ').length > 500) {
        console.log('\n⚠️  SYSTEM NEEDS ADJUSTMENT:');
        console.log('   - Response exceeds 500 words');
        console.log('   - Truncation may not be working properly');
      } else if (!hasFollowUps) {
        console.log('\n⚠️  SYSTEM NEEDS ADJUSTMENT:');
        console.log('   - No follow-up suggestions found');
        console.log('   - Engagement system may not be working');
      }
      
    } else {
      console.log('❌ API returned error:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if the dev server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', { 
      method: 'GET',
      timeout: 5000 
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runTest() {
  console.log('🔍 Checking if dev server is running...');
  
  const isRunning = await checkDevServer();
  if (!isRunning) {
    console.log('❌ Dev server is not running. Please start it with: npm run dev');
    console.log('   Then run this test again.');
    return;
  }
  
  console.log('✅ Dev server is running, proceeding with test...\n');
  
  await test500WordSystem();
  
  console.log('\n✅ Test complete');
  process.exit(0);
}

runTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
