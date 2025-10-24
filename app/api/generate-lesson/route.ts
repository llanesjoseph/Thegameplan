import { NextRequest, NextResponse } from 'next/server'
import { GeminiLessonService } from '@/lib/gemini-lesson-service'
import { requireAuth } from '@/lib/auth-utils'
import { auditExternalAPI } from '@/lib/audit-logger'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Simplified authentication - just verify user is logged in
    const authResult = await requireAuth(request)

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const requestUserId = authResult.user.uid

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
      detailLevel
    })

    let lessonPlan
    let usedFallback = false

    try {
      // Use enhanced lesson generation based on detail level
      switch (detailLevel) {
        case 'masterclass':
          console.log('🔄 Attempting masterclass lesson generation with enhanced AI prompts')
          lessonPlan = await GeminiLessonService.generateMasterclassLesson(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated masterclass lesson plan with enhanced AI')
          break

        case 'expert':
          console.log('🔄 Attempting expert-level lesson generation with enhanced AI prompts')
          lessonPlan = await GeminiLessonService.generateExpertLesson(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated expert-level lesson plan with enhanced AI')
          break

        case 'comprehensive':
          console.log('🔄 Attempting comprehensive lesson generation with enhanced AI prompts')
          lessonPlan = await GeminiLessonService.generateComprehensiveLesson(
            topic, sport, level as any, duration, detailedInstructions
          )
          console.log('✅ Successfully generated comprehensive lesson plan with enhanced AI')
          break

        default:
          // Fallback to original method for backward compatibility
          console.log('🔄 Using standard lesson generation method')

          // Audit external API call start
          await auditExternalAPI(
            'gemini_lesson_generation',
            'generateLessonPlan',
            'POST',
            requestUserId
          )

          try {
            lessonPlan = await GeminiLessonService.generateLessonPlan(
              topic, sport, level as any, duration, detailedInstructions
            )
            console.log('✅ Successfully generated standard lesson plan with Gemini API')

            // Audit successful API call
            await auditExternalAPI(
              'gemini_lesson_generation',
              'generateLessonPlan_success',
              'POST',
              requestUserId,
              200
            )

          } catch (geminiError) {
            // Audit API failure
            await auditExternalAPI(
              'gemini_lesson_generation',
              'generateLessonPlan_failure',
              'POST',
              requestUserId,
              500,
              (geminiError as Error).message
            )
            throw geminiError
          }
      }
    } catch (error) {
      console.error('❌ Enhanced AI generation failed - comprehensive error analysis:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        requestParameters: {
          detailLevel,
          topic,
          sport,
          level,
          duration,
          hasDetailedInstructions: !!detailedInstructions,
          detailedInstructionsLength: detailedInstructions?.length || 0
        },
        environmentCheck: {
          geminiApiKeyExists: !!(process.env.GEMINI_API_KEY),
          nextPublicGeminiApiKeyExists: !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY),
          nodeEnv: process.env.NODE_ENV,
          apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
        },
        timestamp: new Date().toISOString()
      })

      // Test if it's an API key issue by attempting a simple test
      if (error instanceof Error && error.message.includes('API')) {
        console.error('🚨 API-related error detected - this may be due to:')
        console.error('   1. Invalid or missing API key')
        console.error('   2. API quota exceeded')
        console.error('   3. Network connectivity issues')
        console.error('   4. Gemini API service downtime')
      }

      // Use enhanced fallback if API fails
      console.log('🔄 Switching to enhanced fallback lesson template with ultra-comprehensive content')
      lessonPlan = GeminiLessonService.generateFallbackLesson(topic, sport, level, duration, detailedInstructions)
      usedFallback = true
      console.log('✅ Generated comprehensive fallback lesson with detailed professional content')
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