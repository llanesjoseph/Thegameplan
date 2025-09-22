/**
 * Test script to demonstrate dynamic template generation
 */

// Import the content generation service
const { generateDynamicPromptTemplate } = require('./lib/content-generation-service')

// Test scenarios
const testScenarios = [
  {
    name: 'Rock Climbing - Intermediate Lead Climbing',
    request: {
      title: 'Lead Climbing',
      sport: 'Rock Climbing',
      technique: 'Lead Climbing',
      audienceLevel: 'intermediate',
      durationMinutes: 120,
      focus: 'technical',
      safetyLevel: 'high'
    }
  },
  {
    name: 'BJJ - Advanced Leg Locks',
    request: {
      title: 'Leg Lock',
      sport: 'BJJ',
      technique: 'Leg Lock',
      audienceLevel: 'advanced',
      durationMinutes: 90,
      focus: 'technical',
      safetyLevel: 'high'
    }
  },
  {
    name: 'Basketball - Beginner Jump Shot',
    request: {
      title: 'Jump Shot',
      sport: 'Basketball',
      technique: 'Jump Shot',
      audienceLevel: 'beginner',
      durationMinutes: 60,
      focus: 'technical',
      safetyLevel: 'medium'
    }
  }
]

console.log('=== DYNAMIC TEMPLATE SYSTEM TEST ===\n')

testScenarios.forEach((scenario, index) => {
  console.log(`\n--- SCENARIO ${index + 1}: ${scenario.name.toUpperCase()} ---`)

  try {
    const template = generateDynamicPromptTemplate(scenario.request)

    console.log('\n📋 SYSTEM INSTRUCTION PREVIEW:')
    console.log(template.systemInstruction.substring(0, 300) + '...\n')

    console.log('📝 USER PROMPT PREVIEW:')
    console.log(template.userPrompt.substring(0, 300) + '...\n')

    console.log('✅ Template generated successfully!')

  } catch (error) {
    console.log('❌ Error generating template:', error.message)
  }

  console.log('\n' + '='.repeat(60))
})

console.log('\n🎉 Dynamic template system test completed!')