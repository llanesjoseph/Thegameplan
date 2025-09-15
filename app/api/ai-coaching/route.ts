import { NextRequest, NextResponse } from 'next/server'
import { getRobustAIResponse, soccerCoachingContext } from '@/lib/ai-service'
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
    const { question, userId, userEmail, sessionId } = body

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

    // Get AI response
    console.log('🤖 Getting AI response from robust service...')
    const aiResult = await getRobustAIResponse(question, soccerCoachingContext)
    
    const finalResponse = safetyNotice + aiResult.response

    // Log the interaction with proper parameters
    if (userId && userEmail && currentSessionId) {
      try {
        await logAIInteraction(
          userId,
          userEmail,
          currentSessionId,
          question,
          finalResponse,
          aiResult.provider,
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
      provider: aiResult.provider,
      sessionId: currentSessionId,
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
