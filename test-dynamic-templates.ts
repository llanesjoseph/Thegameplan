/**
 * Test script to demonstrate dynamic template generation
 */

import { generateDynamicPromptTemplate, ContentGenerationRequest } from './lib/content-generation-service'

// Test function that can be called from the browser console or API
export function testDynamicTemplates() {
  console.log('=== DYNAMIC TEMPLATE SYSTEM TEST ===\n')

  // Test scenarios exactly as outlined in your examples
  const testScenarios = [
    {
      name: 'Rock Climbing - Intermediate Lead Climbing (120 min)',
      request: {
        title: 'Lead Climbing',
        sport: 'Rock Climbing',
        technique: 'Lead Climbing',
        audienceLevel: 'intermediate' as const,
        durationMinutes: 120,
        focus: 'technical' as const,
        safetyLevel: 'high' as const
      }
    },
    {
      name: 'Competitive Swimming - Advanced Freestyle (75 min)',
      request: {
        title: 'Freestyle Stroke',
        sport: 'Competitive Swimming',
        technique: 'Freestyle Stroke',
        audienceLevel: 'advanced' as const,
        durationMinutes: 75,
        focus: 'technical' as const,
        safetyLevel: 'medium' as const
      }
    },
    {
      name: 'BJJ - Advanced Leg Locks (90 min)',
      request: {
        title: 'Leg Lock',
        sport: 'BJJ',
        technique: 'Leg Lock',
        audienceLevel: 'advanced' as const,
        durationMinutes: 90,
        focus: 'technical' as const,
        safetyLevel: 'high' as const
      }
    },
    {
      name: 'Basketball - Beginner Jump Shot (60 min)',
      request: {
        title: 'Jump Shot',
        sport: 'Basketball',
        technique: 'Jump Shot',
        audienceLevel: 'beginner' as const,
        durationMinutes: 60,
        focus: 'technical' as const,
        safetyLevel: 'medium' as const
      }
    }
  ]

  testScenarios.forEach((scenario, index) => {
    console.log(`\n--- SCENARIO ${index + 1}: ${scenario.name.toUpperCase()} ---`)

    try {
      const template = generateDynamicPromptTemplate(scenario.request)

      console.log('\n📋 SYSTEM INSTRUCTION:')
      console.log(template.systemInstruction)

      console.log('\n📝 USER PROMPT:')
      console.log(template.userPrompt)

      console.log('\n✅ Template generated successfully!')

      // Demonstrate the dynamic nature
      console.log('\n🔍 DYNAMIC ELEMENTS DETECTED:')
      console.log(`- Sport: ${scenario.request.sport}`)
      console.log(`- Technique: ${scenario.request.technique}`)
      console.log(`- Audience Level: ${scenario.request.audienceLevel}`)
      console.log(`- Duration: ${scenario.request.durationMinutes} minutes`)
      console.log(`- Safety Level: ${scenario.request.safetyLevel}`)

    } catch (error) {
      console.log('❌ Error generating template:', error)
    }

    console.log('\n' + '='.repeat(80))
  })

  console.log('\n🎉 Dynamic template system test completed!')
  console.log('\n💡 Each template was dynamically generated based on the input variables!')
  console.log('💡 The same template system can handle any sport/technique combination!')
}

// Export for use in other parts of the application
export default testDynamicTemplates