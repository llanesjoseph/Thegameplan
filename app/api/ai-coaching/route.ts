import { NextRequest, NextResponse } from 'next/server'
import { soccerCoachingContext, getCoachingContext, getEnhancedCoachingContext } from '@/lib/ai-service'
import { generateWithRedundancy } from '@/lib/llm-service'
import { analyzeMedicalSafety, getSafeTrainingResponse } from '@/lib/medical-safety'
import { createAISession, logAIInteraction, CURRENT_TERMS_VERSION } from '@/lib/ai-logging'
import { PersonalizedCoachingEngine, SafetyCoachingSystem } from '@/lib/personalized-coaching'
import { requireAuth } from '@/lib/auth-utils'
import { auditExternalAPI } from '@/lib/audit-logger'
import { logger } from '@/lib/logger'

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
    // Enhanced authentication - but allow unauthenticated requests with fallback responses
    const authResult = await requireAuth(request, ['user', 'creator', 'coach', 'assistant', 'admin', 'superadmin'])

    let authenticatedUserId = null
    let isAuthenticated = false

    if (authResult.success) {
      authenticatedUserId = authResult.user.uid
      isAuthenticated = true
    }

    // Parse request body with better error handling
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

    const { question, userId, userEmail, sessionId, sport, creatorId, creatorName } = body

    // Validate that user can only make requests for themselves (unless admin) - skip if not authenticated
    if (isAuthenticated && userId && userId !== authenticatedUserId && authResult.success && !['admin', 'superadmin'].includes(authResult.user.role || '')) {
      return NextResponse.json({ error: 'Cannot make requests for other users' }, { status: 403 })
    }

    // Use authenticated user ID if not provided, or 'anonymous' for unauthenticated requests
    const requestUserId = userId || authenticatedUserId || 'anonymous'

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
    logger.info('Performing medical safety analysis')
    const safetyAnalysis = analyzeMedicalSafety(question)

    logger.info('Safety Analysis Result:', {
      isSafe: safetyAnalysis.isSafe,
      riskLevel: safetyAnalysis.riskLevel,
      shouldBlock: safetyAnalysis.shouldBlock,
      concernsCount: safetyAnalysis.detectedConcerns.length
    })

    // If medical concerns detected, return safety response instead of AI coaching
    if (safetyAnalysis.shouldBlock) {
      logger.warn('MEDICAL SAFETY BLOCK: Returning safety response instead of AI coaching')

      // Get coach context for proper logging (even during safety blocks)
      const safetyContext = await getEnhancedCoachingContext(creatorId, sport)

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
            safetyContext.sport.toLowerCase(),
            safetyContext.coachName,
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

    // Resolve creator context dynamically with voice profile integration
    const context = await getEnhancedCoachingContext(creatorId, sport)
    console.log(`🎯 Using enhanced coaching context for: ${context.coachName} (${context.sport})`)

    // Log voice integration status
    if (context.voiceCharacteristics) {
      console.log(`🎤 Voice-enhanced coaching active with personalized characteristics`)
    }

    // Creator-specific cache (per-process). Replace with Redis for production.
    // Added version to cache key to bust cache after improvements
    const cacheKey = `v2_${context.coachName}|${creatorId}|${question}`
    const nowTs = Date.now()
    const ttlMs = 24 * 60 * 60 * 1000
    ;(globalThis as any).__aiCache = (globalThis as any).__aiCache || new Map<string, { expires: number; value: string }>()
    const cache: Map<string, { expires: number; value: string }> = (globalThis as any).__aiCache
    const cached = cache.get(cacheKey)
    let responseText: string
    let provider: 'openai' | 'gemini' | 'fallback' = 'fallback'
    let modelUsed = ''
    let latencyMs = 0

    if (cached && cached.expires > nowTs) {
      responseText = cached.value
      provider = 'fallback'
      modelUsed = 'cache'
      latencyMs = 0
    } else {
      console.log('🤖 Generating with redundancy...')
      const apiCallStart = Date.now()

      try {
        // Audit external API call start
        await auditExternalAPI(
          'ai_coaching',
          'generateWithRedundancy',
          'POST',
          requestUserId
        )

        const result = await generateWithRedundancy(question, context)
        responseText = result.text
        provider = result.provider
        modelUsed = result.model
        latencyMs = result.latencyMs
        cache.set(cacheKey, { expires: nowTs + ttlMs, value: responseText })

        // Audit successful API call
        await auditExternalAPI(
          'ai_coaching',
          `${provider}_success`,
          'POST',
          requestUserId,
          200
        )

      } catch (e) {
        console.warn('Both primary and fallback providers failed. Using intelligent fallback.', e)

        // Audit API failure
        await auditExternalAPI(
          'ai_coaching',
          'generateWithRedundancy_failure',
          'POST',
          requestUserId,
          500,
          (e as Error).message
        )

        // Import the fallback function
        const { getIntelligentFallbackResponse } = await import('@/lib/ai-service')
        responseText = getIntelligentFallbackResponse(question, context)
        provider = 'fallback'
        modelUsed = 'none'
        latencyMs = 0
      }
    }

    // Enhance response with personalization and safety
    const personalizedResponse = PersonalizedCoachingEngine.enhanceResponseWithPersonalization(
      question,
      context,
      responseText
    )

    const safetyEnhancedResponse = personalizedResponse + SafetyCoachingSystem.generateSafetyAddendum(
      question,
      context
    )

    // Add authentication notice ONLY for truly unauthenticated users (not those who failed auth but have userId)
    let authNotice = ''
    if (!isAuthenticated && requestUserId === 'anonymous') {
      authNotice = '\n\n---\n\n*💡 Sign in to unlock personalized coaching, progress tracking, and access to exclusive training content! Click the "Sign in" button to get started.*'
    }

    const finalResponse = safetyNotice + safetyEnhancedResponse + authNotice

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
          context.sport.toLowerCase(),
          context.coachName,
          true, // disclaimerShown
          true, // userConsent
          CURRENT_TERMS_VERSION,
          {
            model: modelUsed,
            latencyMs,
            // Note: token usage provided when available by OpenAI; Gemini lacks token usage
            usedCache: modelUsed === 'cache'
          }
        )
      } catch (logError) {
        console.error('Failed to log AI interaction:', logError)
      }
    }

    // Generate personalization analysis for metadata
    const personalizationAnalysis = PersonalizedCoachingEngine.analyzeQuestionForPersonalization(question, context)
    const safetyAnalysisInternal = SafetyCoachingSystem.analyzeSafetyConcerns(question)

    return NextResponse.json({
      success: true,
      response: finalResponse,
      provider,
      model: modelUsed,
      latencyMs,
      sessionId: currentSessionId,
      creatorContext: {
        name: context.coachName,
        sport: context.sport,
        voiceCharacteristics: context.voiceCharacteristics, // For future voice synthesis
      },
      personalization: {
        inferredLevel: personalizationAnalysis.inferredLevel,
        focusAreas: personalizationAnalysis.focusAreas,
        questionType: personalizationAnalysis.questionType,
        urgency: personalizationAnalysis.urgency
      },
      safetyAnalysis: {
        riskLevel: safetyAnalysis.riskLevel,
        isSafe: safetyAnalysis.isSafe,
        internalSafety: {
          hasConcerns: safetyAnalysisInternal.hasConcerns,
          riskLevel: safetyAnalysisInternal.riskLevel,
          concerns: safetyAnalysisInternal.concerns
        }
      },
      rateLimitRemaining: rateLimit.remaining,
      // Enhanced features
      features: {
        personalizedTraining: true,
        progressTracking: true,
        safetyGuidance: true,
        skillAssessment: true
      },
      // Voice response placeholder (not yet implemented)
      voiceResponse: {
        available: false,
        message: 'Voice responses coming soon!'
      }
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
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://playbookd.crucibleanalytics.dev',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean)

  const responseHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (allowedOrigins.includes(origin)) {
    responseHeaders['Access-Control-Allow-Origin'] = origin
  }

  return new NextResponse(null, {
    status: 200,
    headers: responseHeaders,
  })
}
