import { NextRequest, NextResponse } from 'next/server'
import { soccerCoachingContext, getCoachingContext } from '@/lib/ai-service'
import { generateWithRedundancy } from '@/lib/llm-service'
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

    // Resolve creator context dynamically - tries creator ID first, then sport
    const context = getCoachingContext(creatorId, sport)
    console.log(`🎯 Using coaching context for: ${context.coachName} (${context.sport})`)

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
      try {
        const result = await generateWithRedundancy(question, context)
        responseText = result.text
        provider = result.provider
        modelUsed = result.model
        latencyMs = result.latencyMs
        cache.set(cacheKey, { expires: nowTs + ttlMs, value: responseText })
      } catch (e) {
        console.warn('Both primary and fallback providers failed. Using intelligent fallback.', e)
        // Import the fallback function
        const { getIntelligentFallbackResponse } = await import('@/lib/ai-service')
        responseText = getIntelligentFallbackResponse(question, context)
        provider = 'fallback'
        modelUsed = 'none'
        latencyMs = 0
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
      safetyAnalysis: {
        riskLevel: safetyAnalysis.riskLevel,
        isSafe: safetyAnalysis.isSafe
      },
      rateLimitRemaining: rateLimit.remaining,
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
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
