// Test the new lesson creation system
const { LessonCreationEngine } = require('./lib/lesson-creation-service.ts')
const { LessonFormatter } = require('./lib/lesson-formatter.ts')

// Import the AI service for coaching context
const { soccerCoachingContext } = require('./lib/ai-service.ts')

async function testLessonCreation() {
  console.log('🎯 Testing lesson creation with: "Mastering Sweep Mechanics and Timing: Advanced Techniques"')

  try {
    // Create lesson structure
    const lessonStructure = LessonCreationEngine.generateLessonStructure(
      'Mastering Sweep Mechanics and Timing: Advanced Techniques',
      'Brazilian Jiu-Jitsu',
      soccerCoachingContext, // Using as fallback context
      '60 minutes'
    )

    console.log('📋 Generated lesson structure with', lessonStructure.sections.length, 'sections')
    console.log('🎯 Learning objectives:', lessonStructure.objectives.length)

    // Format the lesson
    const formattedLesson = LessonFormatter.formatCompleteLesson(lessonStructure)

    console.log('\n📏 Formatted lesson length:', formattedLesson.length, 'characters')
    console.log('\n🔥 First 500 characters of generated lesson:')
    console.log(formattedLesson.substring(0, 500) + '...')

    // Test quick reference format
    const quickRef = LessonFormatter.generateQuickReference(lessonStructure)
    console.log('\n📝 Quick reference length:', quickRef.length, 'characters')

    console.log('\n✅ Lesson creation test successful!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testLessonCreation()