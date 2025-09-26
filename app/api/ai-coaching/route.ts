import { NextRequest, NextResponse } from 'next/server'
import { soccerCoachingContext, getOpenAIResponse, getGeminiAIResponse, alternativeAIProviders, generateLessonPlanPrompt } from '@/lib/ai-service'
import { analyzeMedicalSafety, getSafeTrainingResponse } from '@/lib/medical-safety'
import { createAISession, logAIInteraction, CURRENT_TERMS_VERSION } from '@/lib/ai-logging'

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { question, userId, userEmail, sessionId, requestType, sport, topic, level, duration } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitId = userId || clientIP
    const rateLimit = checkRateLimit(rateLimitId)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          rateLimitExceeded: true
        },
        { status: 429 }
      )
    }

    // Medical safety check - CRITICAL SAFETY FEATURE
    console.log('🏥 Performing medical safety analysis...')
    const safetyAnalysis = analyzeMedicalSafety(question)
    
    console.log('🔍 Safety Analysis Result:', {
      isSafe: safetyAnalysis.isSafe,
      riskLevel: safetyAnalysis.riskLevel,
      shouldBlock: safetyAnalysis.shouldBlock,
      concernsCount: safetyAnalysis.detectedConcerns.length
    })

    // If medical concerns detected, return safety response instead of AI coaching
    if (safetyAnalysis.shouldBlock) {
      console.log('🚨 MEDICAL SAFETY BLOCK: Returning safety response instead of AI coaching')
      
      // Log the safety event with proper parameters
      if (userId && userEmail && sessionId) {
        try {
          await logAIInteraction(
            userId,
            userEmail,
            sessionId,
            question,
            safetyAnalysis.safetyResponse,
            'emergency', // Use emergency provider for safety blocks
            'soccer',
            soccerCoachingContext.coachName,
            true, // disclaimerShown
            true, // userConsent
            CURRENT_TERMS_VERSION
          )
        } catch (logError) {
          console.error('Failed to log safety event:', logError)
        }
      }

      return NextResponse.json({
        success: true,
        response: safetyAnalysis.safetyResponse,
        provider: 'safety_system',
        safetyBlocked: true,
        riskLevel: safetyAnalysis.riskLevel,
        rateLimitRemaining: rateLimit.remaining
      })
    }

    // If medium risk, prepend safety notice to AI response
    let safetyNotice = ''
    if (safetyAnalysis.riskLevel === 'medium') {
      safetyNotice = safetyAnalysis.safetyResponse + '\n\n---\n\n'
    }

    // Create AI session if needed
    let currentSessionId = sessionId
    if (userId && userEmail && !sessionId) {
      try {
        currentSessionId = await createAISession(
          userId,
          userEmail,
          'basic', // Default subscription tier
          true, // disclaimerAccepted
          CURRENT_TERMS_VERSION,
          '1.0' // privacy policy version
        )
      } catch (sessionError) {
        console.error('Failed to create AI session:', sessionError)
        // Continue without session logging
      }
    }

    // Determine if this is a lesson plan request
    const isLessonPlanRequest = requestType === 'lesson_plan' || 
                               question.toLowerCase().includes('lesson plan') ||
                               question.toLowerCase().includes('create lesson') ||
                               (sport && topic)

    // Get AI response (avoid recursive call to this API route)
    console.log('🤖 Getting AI response (server-safe chain)...')
    let provider: 'openai' | 'gemini' | 'fallback' = 'fallback'
    let responseText: string
    let finalPrompt: string

    if (isLessonPlanRequest) {
      // Generate lesson plan using the structured template
      const lessonSport = sport || 'Brazilian Jiu-Jitsu'
      const lessonTopic = topic || question.replace(/create lesson plan|lesson plan|for/gi, '').trim() || 'Fundamental Techniques'
      const lessonLevel = level || 'Intermediate'
      const lessonDuration = duration || 45
      
      finalPrompt = generateLessonPlanPrompt(lessonSport, lessonTopic, lessonLevel, lessonDuration)
      console.log('📋 Generating lesson plan for:', { sport: lessonSport, topic: lessonTopic, level: lessonLevel, duration: lessonDuration })
    } else {
      // Regular coaching question
      finalPrompt = question
    }

    try {
      if (isLessonPlanRequest) {
        // For lesson plans, use OpenAI with higher token limit
        const client = require('openai')
        const openai = new client.OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert martial arts and sports coach curriculum designer. Create detailed, professional lesson plans with proper formatting and structure.'
            },
            {
              role: 'user',
              content: finalPrompt
            }
          ],
          max_tokens: 4000, // Higher limit for lesson plans
          temperature: 0.7,
          top_p: 0.9
        })
        
        responseText = completion.choices[0]?.message?.content || 'Failed to generate lesson plan'
        provider = 'openai'
      } else {
        // Regular coaching responses
        responseText = await getOpenAIResponse(finalPrompt, soccerCoachingContext)
        provider = 'openai'
      }
    } catch (e1) {
      console.warn('OpenAI provider failed, trying Gemini...', e1)
      try {
        if (isLessonPlanRequest) {
          // For lesson plans with Gemini, use higher token limit
          const { GoogleGenerativeAI } = require('@google/generative-ai')
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 4000,
            }
          })
          
          const result = await model.generateContent(finalPrompt)
          const response = await result.response
          responseText = response.text()
        } else {
          responseText = await getGeminiAIResponse(finalPrompt, soccerCoachingContext)
        }
        provider = 'gemini'
      } catch (e2) {
        console.warn('Gemini provider failed, falling back...', e2)
        responseText = await alternativeAIProviders.fallback(finalPrompt, soccerCoachingContext)
        provider = 'fallback'
      }
    }

    const finalResponse = safetyNotice + responseText

    // Log the interaction with proper parameters
    if (userId && userEmail && currentSessionId) {
      try {
        await logAIInteraction(
          userId,
          userEmail,
          currentSessionId,
          question,
          finalResponse,
          provider,
          'soccer',
          soccerCoachingContext.coachName,
          true, // disclaimerShown
          true, // userConsent
          CURRENT_TERMS_VERSION
        )
      } catch (logError) {
        console.error('Failed to log AI interaction:', logError)
      }
    }

    return NextResponse.json({
      success: true,
      response: finalResponse,
      provider,
      sessionId: currentSessionId,
      isLessonPlan: isLessonPlanRequest,
      lessonPlanData: isLessonPlanRequest ? {
        sport: sport || 'Brazilian Jiu-Jitsu',
        topic: topic || question.replace(/create lesson plan|lesson plan|for/gi, '').trim() || 'Fundamental Techniques',
        level: level || 'Intermediate',
        duration: duration || 45
      } : null,
      safetyAnalysis: {
        riskLevel: safetyAnalysis.riskLevel,
        isSafe: safetyAnalysis.isSafe
      },
      rateLimitRemaining: rateLimit.remaining
    })

  } catch (error) {
    console.error('AI Coaching API Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.',
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
