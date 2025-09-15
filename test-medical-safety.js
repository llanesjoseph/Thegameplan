// Simple test script to verify medical safety system
const { analyzeMedicalSafety } = require('./lib/medical-safety.ts')

console.log('🧪 Testing Medical Safety System...\n')

// Test cases
const testCases = [
  {
    name: 'Safe Training Question',
    input: 'How can I improve my passing accuracy in soccer?',
    expectedSafe: true
  },
  {
    name: 'Injury Mention - High Risk',
    input: 'I think I broke my ankle during practice yesterday',
    expectedSafe: false,
    expectedRisk: 'critical'
  },
  {
    name: 'Pain Mention - Medium Risk',
    input: 'I have some pain in my knee after running',
    expectedSafe: false,
    expectedRisk: 'medium'
  },
  {
    name: 'Medical Question - High Risk',
    input: 'Should I see a doctor for this injury?',
    expectedSafe: false,
    expectedRisk: 'high'
  },
  {
    name: 'Emergency Phrase - Critical Risk',
    input: 'I just broke my wrist, what should I do?',
    expectedSafe: false,
    expectedRisk: 'critical'
  }
]

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`)
  console.log(`Input: "${testCase.input}"`)
  
  try {
    const result = analyzeMedicalSafety(testCase.input)
    
    console.log(`✅ Safe: ${result.isSafe}`)
    console.log(`✅ Risk Level: ${result.riskLevel}`)
    console.log(`✅ Should Block: ${result.shouldBlock}`)
    console.log(`✅ Concerns: ${result.detectedConcerns.length}`)
    
    if (result.detectedConcerns.length > 0) {
      console.log(`   - ${result.detectedConcerns.join('\n   - ')}`)
    }
    
    // Verify expectations
    if (result.isSafe === testCase.expectedSafe) {
      console.log('✅ Safety check PASSED')
    } else {
      console.log('❌ Safety check FAILED')
    }
    
    if (testCase.expectedRisk && result.riskLevel === testCase.expectedRisk) {
      console.log('✅ Risk level PASSED')
    } else if (testCase.expectedRisk) {
      console.log(`❌ Risk level FAILED (expected: ${testCase.expectedRisk}, got: ${result.riskLevel})`)
    }
    
  } catch (error) {
    console.log('❌ Test FAILED with error:', error.message)
  }
  
  console.log('---\n')
})

console.log('🏁 Medical Safety System Testing Complete!')
