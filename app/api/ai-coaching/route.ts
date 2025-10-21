/**
 * AI Coaching API Route - Rebuilt with QA Agent Architecture
 *
 * Clean, simple route that delegates to the robust QA agent pipeline.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processCoachQuestion, type QARequest, type EnsembleMode } from '@/lib/coach-qa-agent'
import { createAISession, logAIInteraction, CURRENT_TERMS_VERSION } from '@/lib/ai-logging'
import { requireAuth } from '@/lib/auth-utils'
import { auditExternalAPI } from '@/lib/audit-logger'
import { logger } from '@/lib/logger'
import { analyzeMentalHealthSafety, logMentalHealthEvent } from '@/lib/mental-health-safety'
import type { AIProvider } from '@/types'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
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

// ============================================================================
// HELPER: Map EnsembleMode to AIProvider for logging
// ============================================================================

/**
 * Maps QA Agent ensemble modes to AIProvider types for interaction logging.
 * This maintains compatibility with the existing logging system while using
 * the new ensemble architecture.
 */
function mapEnsembleModeToProvider(mode: EnsembleMode): AIProvider {
  switch (mode) {
    case 'cross_check':
      return 'gemini' // Primary model used in cross-check mode
    case 'consensus':
      return 'openai' // Primary model used in consensus mode
    case 'mixture_of_experts':
      return 'gemini' // Default to gemini for MoE
    default:
      return 'gemini' // Safe default
  }
}

// ============================================================================
// MAIN POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('[API] Received AI coaching request')

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const authResult = await requireAuth(request, ['user', 'creator', 'coach', 'assistant', 'admin', 'superadmin'])

    let authenticatedUserId: string | null = null
    let isAuthenticated = false

    if (authResult.success) {
      authenticatedUserId = authResult.user.uid
      isAuthenticated = true
    }

    // ========================================================================
    // PARSE REQUEST
    // ========================================================================
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      logger.error('[API] Invalid JSON in request body', { error: jsonError })
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const {
      question,
      userId,
      userEmail,
      sessionId,
      creatorId, // coach_id
      mode,
      flags,
      conversationHistory
    } = body

    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Validate user can only make requests for themselves (unless admin)
    if (isAuthenticated && userId && userId !== authenticatedUserId &&
        authResult.success && !['admin', 'superadmin'].includes(authResult.user.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Cannot make requests for other users' },
        { status: 403 }
      )
    }

    // Use authenticated user ID if not provided
    const requestUserId = userId || authenticatedUserId || 'anonymous'

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    if (!creatorId) {
      logger.warn('[API] Missing creatorId in AI coaching request', { userId: requestUserId })
      return NextResponse.json(
        {
          success: false,
          error: 'You need to be assigned to a coach to use the AI assistant. Please contact your administrator.',
          errorCode: 'NO_COACH_ASSIGNED'
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitId = requestUserId !== 'anonymous' ? requestUserId : clientIP
    const rateLimit = checkRateLimit(rateLimitId)

    if (!rateLimit.allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier: rateLimitId })
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimitExceeded: true
        },
        { status: 429 }
      )
    }

    // ========================================================================
    // CREATE AI SESSION (if needed)
    // ========================================================================
    let currentSessionId = sessionId

    if (requestUserId !== 'anonymous' && userEmail && !sessionId) {
      try {
        currentSessionId = await createAISession(
          requestUserId,
          userEmail,
          'basic', // Default subscription tier
          true, // disclaimerAccepted
          CURRENT_TERMS_VERSION,
          '1.0' // privacy policy version
        )
        logger.info('[API] Created new AI session', { sessionId: currentSessionId })
      } catch (sessionError) {
        logger.error('[API] Failed to create AI session', { error: sessionError })
        // Continue without session logging
      }
    }

    // ========================================================================
    // MENTAL HEALTH SAFETY CHECK
    // ========================================================================
    const mentalHealthCheck = analyzeMentalHealthSafety(question)

    if (mentalHealthCheck.isCrisis || mentalHealthCheck.shouldBlock) {
      logger.warn('[API] Mental health crisis detected', {
        user_id: requestUserId,
        risk_level: mentalHealthCheck.riskLevel
      })

      // Log for human review
      await logMentalHealthEvent(requestUserId, question, mentalHealthCheck)

      // Return crisis response immediately
      return NextResponse.json({
        success: true,
        response: mentalHealthCheck.safetyResponse,
        sources: [],
        confidence: {
          overall: 1.0,
          coverage: 1.0,
          agreement: 1.0,
          recency: 1.0
        },
        provider: 'safety_system',
        model: 'mental_health_safety',
        latencyMs: 0,
        sessionId: currentSessionId,
        metadata: {
          mode: 'safety_intervention',
          safety_checked: true,
          safety_level: mentalHealthCheck.riskLevel,
          voice_refined: false,
          pipeline_stages: ['mental_health_safety']
        },
        mentalHealthCrisis: true,
        hotlineInfo: mentalHealthCheck.hotlineInfo,
        rateLimitRemaining: rateLimit.remaining
      })
    }

    // ========================================================================
    // PROCESS QUESTION THROUGH QA AGENT
    // ========================================================================
    logger.info('[API] Processing question through QA agent', {
      user_id: requestUserId,
      coach_id: creatorId,
      mode: mode || 'cross_check'
    })

    // Audit external API call start
    await auditExternalAPI(
      'ai_coaching',
      'processCoachQuestion',
      'POST',
      requestUserId
    )

    const qaRequest: QARequest = {
      user_id: requestUserId,
      coach_id: creatorId,
      question,
      mode: mode || 'cross_check',
      flags: flags || {},
      conversation_history: conversationHistory || []
    }

    const qaResponse = await processCoachQuestion(qaRequest)

    // Audit successful API call
    await auditExternalAPI(
      'ai_coaching',
      'processCoachQuestion_success',
      'POST',
      requestUserId,
      200
    )

    logger.info('[API] QA agent processing complete', {
      latency: qaResponse.metadata.latencyMs,
      confidence: qaResponse.confidence.overall,
      stages: qaResponse.metadata.pipeline_stages.length
    })

    // ========================================================================
    // LOG INTERACTION
    // ========================================================================
    if (requestUserId !== 'anonymous' && userEmail && currentSessionId) {
      try {
        await logAIInteraction(
          requestUserId,
          userEmail,
          currentSessionId,
          question,
          qaResponse.text,
          mapEnsembleModeToProvider(qaResponse.metadata.mode), // provider
          'sports', // sport (generic)
          'AI Coach', // coach name (generic)
          true, // disclaimerShown
          true, // userConsent
          CURRENT_TERMS_VERSION,
          {
            model: qaResponse.metadata.mode, // Track which ensemble mode was used
            latencyMs: qaResponse.metadata.latencyMs
          }
        )
        logger.info('[API] Interaction logged successfully')
      } catch (logError) {
        logger.error('[API] Failed to log AI interaction', { error: logError })
      }
    }

    // ========================================================================
    // ADD AUTH NOTICE FOR ANONYMOUS USERS
    // ========================================================================
    let finalText = qaResponse.text

    if (!isAuthenticated && requestUserId === 'anonymous') {
      finalText += '\n\n---\n\n*💡 Sign in to unlock personalized coaching, progress tracking, and access to exclusive training content!*'
    }

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================
    return NextResponse.json({
      success: true,
      response: finalText,
      sources: qaResponse.sources,
      confidence: qaResponse.confidence,
      provider: qaResponse.metadata.mode,
      model: qaResponse.metadata.mode,
      latencyMs: qaResponse.metadata.latencyMs,
      sessionId: currentSessionId,
      metadata: {
        mode: qaResponse.metadata.mode,
        safety_checked: qaResponse.metadata.safety_checked,
        safety_level: qaResponse.metadata.safety_level,
        voice_refined: qaResponse.metadata.voice_refined,
        pipeline_stages: qaResponse.metadata.pipeline_stages
      },
      rateLimitRemaining: rateLimit.remaining
    })

  } catch (error) {
    logger.error('[API] Error processing AI coaching request', { error })

    // Audit API failure
    try {
      await auditExternalAPI(
        'ai_coaching',
        'processCoachQuestion_failure',
        'POST',
        'unknown',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } catch {
      // Ignore audit errors
    }

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

// ============================================================================
// OPTIONS HANDLER (CORS)
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://playbook.crucibleanalytics.dev',
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
