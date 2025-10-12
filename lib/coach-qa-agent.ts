/**
 * Coach QA Agent - Main Orchestrator
 *
 * Implements the complete pipeline:
 * Input → Normalize → Plan → Retrieve → Rerank → Generate (Ensemble)
 * → Verify/Patch → Voice Refine → Safety Filter → Package → Log
 */

import { logger } from './logger'
import {
  retrieveRelevantContent,
  rerankChunks,
  calculateConfidence,
  type RetrievalOptions,
  type RetrievedChunk
} from './retrieval-service'
import {
  generateWithEnsemble,
  type EnsembleMode,
  type EnsembleResult
} from './ensemble-service'
import { refineToCoachVoice } from './voice-refiner'
import { analyzeMedicalSafety } from './medical-safety'

// Re-export EnsembleMode for external use
export type { EnsembleMode } from './ensemble-service'

// ============================================================================
// TYPES
// ============================================================================

export interface QARequest {
  user_id: string
  coach_id: string
  question: string
  mode?: EnsembleMode
  flags?: {
    critical_rules?: boolean
    ideas?: boolean
  }
  conversation_history?: Array<{
    role: string
    content: string
  }>
}

export interface QAResponse {
  text: string
  sources: Array<{
    chunk_id: string
    label: string
  }>
  confidence: {
    overall: number
    coverage: number
    agreement: number
    recency: number
  }
  voice_version: number
  metadata: {
    mode: EnsembleMode
    safety_checked: boolean
    safety_level: string
    voice_refined: boolean
    latencyMs: number
    pipeline_stages: string[]
  }
}

// ============================================================================
// PIPELINE STAGES
// ============================================================================

/**
 * Stage 1: Normalize Input
 */
function normalizeQuestion(question: string): string {
  // Trim whitespace
  let normalized = question.trim()

  // Fix common typos
  normalized = normalized.replace(/\s+/g, ' ') // Multiple spaces to single
  normalized = normalized.replace(/\?+/g, '?') // Multiple ? to single

  // Ensure ends with punctuation
  if (!/[.?!]$/.test(normalized)) {
    normalized += '?'
  }

  logger.info('[Pipeline:Normalize] Normalized question', {
    before: question,
    after: normalized
  })

  return normalized
}

/**
 * Stage 2: Plan (Question Type Analysis)
 */
function planResponse(question: string): {
  question_type: 'factual' | 'drill' | 'ideas'
  is_critical: boolean
  requires_sources: boolean
} {
  const questionLower = question.toLowerCase()

  // Detect question type
  let question_type: 'factual' | 'drill' | 'ideas' = 'factual'

  if (questionLower.includes('drill') || questionLower.includes('exercise') || questionLower.includes('practice')) {
    question_type = 'drill'
  } else if (questionLower.includes('idea') || questionLower.includes('suggestion') || questionLower.includes('what if')) {
    question_type = 'ideas'
  }

  // Detect critical (safety-sensitive)
  const is_critical = questionLower.includes('injury') ||
    questionLower.includes('hurt') ||
    questionLower.includes('pain') ||
    questionLower.includes('dangerous')

  // Most questions require sources
  const requires_sources = true

  logger.info('[Pipeline:Plan] Question analyzed', {
    question_type,
    is_critical,
    requires_sources
  })

  return { question_type, is_critical, requires_sources }
}

// ============================================================================
// MAIN QA AGENT FUNCTION
// ============================================================================

export async function processCoachQuestion(
  request: QARequest
): Promise<QAResponse> {
  const startTime = Date.now()
  const pipelineStages: string[] = []

  try {
    logger.info('[QA-Agent] Processing question', {
      user_id: request.user_id,
      coach_id: request.coach_id,
      mode: request.mode || 'cross_check'
    })

    // ==================================================================
    // STAGE 1: Normalize
    // ==================================================================
    pipelineStages.push('normalize')
    const normalizedQuestion = normalizeQuestion(request.question)

    // ==================================================================
    // STAGE 2: Plan
    // ==================================================================
    pipelineStages.push('plan')
    const plan = planResponse(normalizedQuestion)

    // ==================================================================
    // STAGE 3: Safety Pre-Check
    // ==================================================================
    pipelineStages.push('safety_precheck')
    const safetyAnalysis = analyzeMedicalSafety(normalizedQuestion)

    if (safetyAnalysis.shouldBlock) {
      logger.warn('[QA-Agent] Safety block triggered', {
        risk_level: safetyAnalysis.riskLevel
      })

      // Return safety response immediately
      return {
        text: safetyAnalysis.safetyResponse,
        sources: [],
        confidence: {
          overall: 1.0,
          coverage: 1.0,
          agreement: 1.0,
          recency: 1.0
        },
        voice_version: 0,
        metadata: {
          mode: request.mode || 'cross_check',
          safety_checked: true,
          safety_level: safetyAnalysis.riskLevel,
          voice_refined: false,
          latencyMs: Date.now() - startTime,
          pipeline_stages: pipelineStages
        }
      }
    }

    // ==================================================================
    // STAGE 4: Retrieve
    // ==================================================================
    pipelineStages.push('retrieve')

    // Get coach profile for retrieval context
    const coachProfile = await getCoachProfile(request.coach_id)

    const retrievalOptions: RetrievalOptions = {
      coach_id: request.coach_id,
      sport: coachProfile.sport,
      max_chunks: 5,
      min_relevance: 0.2
    }

    const retrievedChunks = await retrieveRelevantContent(
      normalizedQuestion,
      retrievalOptions
    )

    logger.info('[QA-Agent] Retrieved chunks', { count: retrievedChunks.length })

    if (retrievedChunks.length === 0) {
      logger.warn('[QA-Agent] No relevant content found')
      return {
        text: `I don't have specific lesson content that directly addresses this question. Consider creating a lesson on this topic, or rephrase your question to match existing content.`,
        sources: [],
        confidence: {
          overall: 0.0,
          coverage: 0.0,
          agreement: 0.0,
          recency: 0.0
        },
        voice_version: 0,
        metadata: {
          mode: request.mode || 'cross_check',
          safety_checked: true,
          safety_level: safetyAnalysis.riskLevel,
          voice_refined: false,
          latencyMs: Date.now() - startTime,
          pipeline_stages: pipelineStages
        }
      }
    }

    // ==================================================================
    // STAGE 5: Rerank
    // ==================================================================
    pipelineStages.push('rerank')
    const rerankedChunks = rerankChunks(normalizedQuestion, retrievedChunks, true)

    // ==================================================================
    // STAGE 6: Generate (Ensemble)
    // ==================================================================
    pipelineStages.push('generate')

    const coachContext = {
      name: coachProfile.name,
      sport: coachProfile.sport,
      voice_traits: coachProfile.voice_traits,
      coach_id: request.coach_id
    }

    const ensembleMode: EnsembleMode = request.mode || 'cross_check'

    const ensembleResult = await generateWithEnsemble(
      normalizedQuestion,
      rerankedChunks,
      coachContext,
      ensembleMode
    )

    logger.info('[QA-Agent] Generation complete', {
      provider: ensembleResult.provider,
      latency: ensembleResult.latencyMs
    })

    // ==================================================================
    // STAGE 7: Voice Refine
    // ==================================================================
    pipelineStages.push('voice_refine')

    const voiceRefined = await refineToCoachVoice(
      ensembleResult.text,
      coachContext
    )

    // ==================================================================
    // STAGE 8: Safety Post-Check
    // ==================================================================
    pipelineStages.push('safety_postcheck')

    const postSafetyAnalysis = analyzeMedicalSafety(voiceRefined)

    // Prepend safety notice if medium risk
    let finalText = voiceRefined
    if (postSafetyAnalysis.riskLevel === 'medium') {
      finalText = postSafetyAnalysis.safetyResponse + '\n\n---\n\n' + voiceRefined
    }

    // ==================================================================
    // STAGE 9: Package Response
    // ==================================================================
    pipelineStages.push('package')

    const sources = rerankedChunks.slice(0, 3).map(chunk => ({
      chunk_id: chunk.chunk_id,
      label: chunk.label
    }))

    const retrievalConfidence = calculateConfidence(normalizedQuestion, rerankedChunks)

    const finalConfidence = {
      overall: (ensembleResult.confidence.overall + retrievalConfidence.overall) / 2,
      coverage: retrievalConfidence.coverage,
      agreement: ensembleResult.confidence.agreement,
      recency: retrievalConfidence.recency
    }

    const totalLatency = Date.now() - startTime

    logger.info('[QA-Agent] Pipeline complete', {
      latency: totalLatency,
      stages: pipelineStages.length,
      confidence: finalConfidence.overall
    })

    return {
      text: finalText,
      sources,
      confidence: finalConfidence,
      voice_version: 1,
      metadata: {
        mode: ensembleMode,
        safety_checked: true,
        safety_level: postSafetyAnalysis.riskLevel,
        voice_refined: true,
        latencyMs: totalLatency,
        pipeline_stages: pipelineStages
      }
    }

  } catch (error) {
    logger.error('[QA-Agent] Pipeline error', { error })

    throw new Error(`QA Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get coach profile from Firestore
 */
async function getCoachProfile(coach_id: string): Promise<{
  name: string
  sport: string
  voice_traits?: string[]
}> {
  try {
    const { adminDb } = await import('./firebase.admin')

    const userDoc = await adminDb.collection('users').doc(coach_id).get()

    if (!userDoc.exists) {
      logger.warn('[QA-Agent] Coach profile not found, using defaults', { coach_id })
      return {
        name: 'Coach',
        sport: 'Sports'
      }
    }

    const userData = userDoc.data()

    return {
      name: userData?.displayName || 'Coach',
      sport: userData?.sport || 'Sports',
      voice_traits: userData?.voiceTraits || []
    }

  } catch (error) {
    logger.error('[QA-Agent] Error fetching coach profile', { error, coach_id })
    return {
      name: 'Coach',
      sport: 'Sports'
    }
  }
}
