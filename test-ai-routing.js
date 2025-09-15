// Test script to verify AI coaching sport detection and routing

const testQuestions = [
  // BJJ Questions
  { 
    question: "i need help getting back on the mats after a freak accident that broke my elbow during an arm bar",
    expectedSport: "bjj",
    expectedCoach: "Joseph Llanes"
  },
  { 
    question: "how can i improve my guard retention against stronger opponents",
    expectedSport: "bjj", 
    expectedCoach: "Joseph Llanes"
  },
  { 
    question: "what are effective strategies for escaping side control",
    expectedSport: "bjj",
    expectedCoach: "Joseph Llanes"
  },
  { 
    question: "how do i develop better submission chains from mount",
    expectedSport: "bjj",
    expectedCoach: "Joseph Llanes"
  },
  
  // Soccer Questions
  { 
    question: "how can i improve my passing accuracy under pressure",
    expectedSport: "soccer",
    expectedCoach: "Jasmine Aikey"
  },
  { 
    question: "what drills help with first touch and ball control",
    expectedSport: "soccer",
    expectedCoach: "Jasmine Aikey"
  },
  { 
    question: "i injured my ankle during a slide tackle, how do i get back on the field",
    expectedSport: "soccer",
    expectedCoach: "Jasmine Aikey"
  },
  { 
    question: "how do i improve my shooting accuracy from outside the box",
    expectedSport: "soccer",
    expectedCoach: "Jasmine Aikey"
  },
  
  // Edge Cases
  { 
    question: "i have a general sports injury and need advice",
    expectedSport: "soccer", // should default
    expectedCoach: "Jasmine Aikey"
  },
  { 
    question: "how do i stay motivated after an injury",
    expectedSport: "soccer", // should default
    expectedCoach: "Jasmine Aikey"
  }
]

async function testAIRouting() {
  console.log("🧪 Testing AI Coaching Sport Detection and Routing\n")
  
  for (let i = 0; i < testQuestions.length; i++) {
    const test = testQuestions[i]
    console.log(`Test ${i + 1}: ${test.question.substring(0, 60)}...`)
    console.log(`Expected: ${test.expectedSport} → ${test.expectedCoach}`)
    
    try {
      const response = await fetch('http://localhost:3002/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: test.question,
          sport: null // Let system auto-detect
        })
      })
      
      const data = await response.json()
      
      // Check if response contains expected coach name
      const responseText = data.response || ""
      const hasExpectedCoach = responseText.includes(test.expectedCoach)
      
      console.log(`Result: ${hasExpectedCoach ? '✅ PASS' : '❌ FAIL'} - ${hasExpectedCoach ? 'Correct coach detected' : 'Wrong coach or mixed content'}`)
      
      if (!hasExpectedCoach) {
        console.log(`   Response preview: ${responseText.substring(0, 100)}...`)
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
    }
    
    console.log('')
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

testAIRouting().catch(console.error)