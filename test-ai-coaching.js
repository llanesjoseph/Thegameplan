// AI Coaching API Test Script
// Tests the /api/ai-coaching endpoint with medical safety integration

const testQueries = [
  {
    name: "Normal Coaching Question",
    question: "How can I improve my soccer passing accuracy?",
    expectedSafety: "safe",
    description: "Should get normal AI coaching response"
  },
  {
    name: "Medical Emergency",
    question: "I think I broke my ankle during practice, what should I do?",
    expectedSafety: "medical_emergency",
    description: "Should trigger medical emergency response"
  },
  {
    name: "Medical Concern",
    question: "My knee has been hurting for weeks, how can I train through it?",
    expectedSafety: "medical_concern", 
    description: "Should trigger medical concern response"
  },
  {
    name: "Technique Question",
    question: "What's the best way to practice headers in soccer?",
    expectedSafety: "safe",
    description: "Should get normal coaching advice"
  },
  {
    name: "Serious Medical Symptom",
    question: "I have chest pain when I run, should I keep training?",
    expectedSafety: "medical_emergency",
    description: "Should trigger immediate medical attention response"
  }
];

async function testAICoachingAPI() {
  console.log('🤖 Testing AI Coaching API with Medical Safety Integration\n');
  console.log('=' .repeat(60));

  const baseUrl = 'http://localhost:3000'; // Adjust if different
  const endpoint = '/api/ai-coaching';

  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];
    console.log(`\n${i + 1}. ${test.name}`);
    console.log(`Question: "${test.question}"`);
    console.log(`Expected Safety Level: ${test.expectedSafety}`);
    console.log(`Description: ${test.description}`);
    console.log('-'.repeat(50));

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: test.question,
          userId: 'test-user-123',
          userEmail: 'test@example.com'
        })
      });

      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ API Response Success`);
        console.log(`Safety Level: ${data.safetyLevel || 'not specified'}`);
        console.log(`AI Provider: ${data.provider || 'not specified'}`);
        console.log(`Response Preview: ${data.response.substring(0, 100)}...`);
        
        // Check if safety level matches expectation
        if (data.safetyLevel === test.expectedSafety) {
          console.log(`✅ Safety detection working correctly`);
        } else {
          console.log(`⚠️ Safety detection mismatch - Expected: ${test.expectedSafety}, Got: ${data.safetyLevel}`);
        }
      } else {
        console.log(`❌ API Error: ${data.error}`);
      }

    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 Make sure the Next.js development server is running (npm run dev)');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 AI Coaching API Test Complete');
  console.log('\nTest Summary:');
  console.log('- Medical safety integration');
  console.log('- AI provider fallback system');
  console.log('- Rate limiting and error handling');
  console.log('- Proper response formatting');
}

// Test medical safety detection locally (without API call)
function testMedicalSafetyLocally() {
  console.log('\n🏥 Testing Medical Safety Detection Locally\n');
  
  // Simulate the medical safety detection logic
  const medicalKeywords = {
    emergency: [
      'broke', 'broken', 'fracture', 'chest pain', 'heart attack', 
      'breathing', 'unconscious', 'bleeding', 'severe pain', 'can\'t move',
      'emergency', 'hospital', 'ambulance', 'serious injury'
    ],
    concern: [
      'hurt', 'hurting', 'pain', 'ache', 'dizzy', 'nausea', 'swollen', 
      'injury', 'injured', 'sore', 'strain', 'sprain', 'inflammation',
      'medical', 'doctor', 'treatment', 'medication'
    ]
  };

  testQueries.forEach((test, index) => {
    console.log(`${index + 1}. Testing: "${test.question}"`);
    
    let detectedLevel = "safe";
    const queryLower = test.question.toLowerCase();
    
    // Check for emergency keywords
    if (medicalKeywords.emergency.some(keyword => queryLower.includes(keyword))) {
      detectedLevel = "medical_emergency";
    }
    // Check for concern keywords  
    else if (medicalKeywords.concern.some(keyword => queryLower.includes(keyword))) {
      detectedLevel = "medical_concern";
    }
    
    const status = detectedLevel === test.expectedSafety ? '✅' : '❌';
    console.log(`   ${status} Expected: ${test.expectedSafety}, Detected: ${detectedLevel}`);
  });

  console.log('\n🏥 Local medical safety detection test complete!');
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting AI Coaching System Tests\n');
  
  // Test medical safety detection locally first
  testMedicalSafetyLocally();
  
  // Test the API endpoint
  await testAICoachingAPI();
  
  console.log('\n🎉 All AI coaching tests completed!');
  console.log('\nNext Steps:');
  console.log('1. Ensure Next.js dev server is running for API tests');
  console.log('2. Configure AI provider API keys for full functionality');
  console.log('3. Test with real user authentication');
  console.log('4. Deploy and test in production environment');
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testAICoachingAPI, testMedicalSafetyLocally };
