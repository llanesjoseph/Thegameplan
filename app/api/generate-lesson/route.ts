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

    const { topic, sport, level = 'intermediate', duration = '45 minutes', detailedInstructions } = body

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

    console.log('🚀 Generating lesson plan:', {
      topic,
      sport,
      level,
      duration,
      hasDetailedInstructions: !!detailedInstructions
    })

    let lessonPlan
    let usedFallback = false

    try {
      // Try to generate with Gemini API
      lessonPlan = await GeminiLessonService.generateLessonPlan(topic, sport, level as any, duration, detailedInstructions)
      console.log('✅ Successfully generated lesson plan with Gemini API')
    } catch (error) {
      console.warn('⚠️ Gemini API failed, using fallback:', error)
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
        generatedAt: new Date().toISOString(),
        wordCount: markdownContent.length,
        sections: lessonPlan.parts.length
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