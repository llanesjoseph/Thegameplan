import { NextRequest, NextResponse } from 'next/server'
import { GeminiLessonService } from '@/lib/gemini-lesson-service'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const {
      topic,
      sport,
      level = 'intermediate',
      duration = '45 minutes',
      detailedInstructions,
      detailLevel = 'masterclass' // New parameter for lesson detail level
    } = body

    // Validate required fields
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Topic is required and must be a string' },
        { status: 400 }
      )
    }

    if (!sport || typeof sport !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Sport is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate level
    const validLevels = ['beginner', 'intermediate', 'advanced']
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Level must be beginner, intermediate, or advanced' },
        { status: 400 }
      )
    }

    console.log('🚀 Generating enhanced lesson plan:', {
      topic,
      sport,
      level,
      duration,
      detailLevel,
      hasDetailedInstructions: !!detailedInstructions
    })

    let lessonPlan
    let usedFallback = false

    try {
      // Use enhanced lesson generation based on detail level
      switch (detailLevel) {
        case 'masterclass':
          lessonPlan = await GeminiLessonService.generateMasterclassLesson(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated masterclass lesson plan with enhanced AI')
          break

        case 'expert':
          lessonPlan = await GeminiLessonService.generateExpertLesson(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated expert-level lesson plan with enhanced AI')
          break

        case 'comprehensive':
          lessonPlan = await GeminiLessonService.generateComprehensiveLesson(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated comprehensive lesson plan with enhanced AI')
          break

        default:
          // Fallback to original method for backward compatibility
          lessonPlan = await GeminiLessonService.generateLessonPlan(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated standard lesson plan with Gemini API')
      }
    } catch (error) {
      console.warn('⚠️ Enhanced AI generation failed, using fallback:', error)
      // Use fallback if API fails
      lessonPlan = GeminiLessonService.generateFallbackLesson(topic, sport, level, duration, detailedInstructions)
      usedFallback = true
    }

    // Convert to markdown format
    const markdownContent = GeminiLessonService.formatLessonAsMarkdown(lessonPlan)

    return NextResponse.json({
      success: true,
      lessonPlan,
      markdownContent,
      usedFallback,
      metadata: {
        topic,
        sport,
        level,
        duration,
        detailLevel,
        generatedAt: new Date().toISOString(),
        wordCount: markdownContent.length,
        characterCount: markdownContent.length,
        sections: lessonPlan.parts.length,
        totalSections: lessonPlan.parts.reduce((total, part) => total + part.sections.length, 0),
        enhancedGeneration: !usedFallback
      }
    })

  } catch (error) {
    console.error('Lesson generation API error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate lesson plan. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}