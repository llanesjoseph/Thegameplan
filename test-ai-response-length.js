const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log('🧪 TESTING AI RESPONSE LENGTH: Verifying token limit fixes\n');

async function testAIResponseLength() {
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
      console.log('🔢 Estimated token count:', Math.ceil(data.response.length / 4), 'tokens (rough estimate)');
      
      // Check if response seems complete (doesn't end abruptly)
      const lastSentence = data.response.trim().split('.').pop();
      const endsWithPunctuation = /[.!?]$/.test(data.response.trim());
      
      console.log('\n📋 Response Analysis:');
      console.log('   Ends with punctuation:', endsWithPunctuation ? '✅' : '❌');
      console.log('   Last 50 characters:', data.response.slice(-50));
      
      if (data.response.length > 1000) {
        console.log('✅ Response is substantial (>1000 chars)');
      } else {
        console.log('⚠️  Response seems short (<1000 chars)');
      }
      
      if (endsWithPunctuation) {
        console.log('✅ Response appears complete');
      } else {
        console.log('❌ Response may be truncated');
      }
      
      // Show first 200 characters
      console.log('\n📖 Response preview (first 200 chars):');
      console.log(data.response.substring(0, 200) + '...');
      
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
  
  await testAIResponseLength();
  
  console.log('\n✅ Test complete');
  process.exit(0);
}

runTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
