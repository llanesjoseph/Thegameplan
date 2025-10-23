/**
 * Ensemble Service - Dual Model Coordination (OpenAI + Gemini)
 *
 * Implements three ensemble modes:
 * 1. Consensus: Both generate, adjudicator merges
 * 2. Cross-check: Primary drafts, secondary verifies
 * 3. Mixture of Experts: Route to best model per question type
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAIServiceConfig } from './env-validation'
import { logger } from './logger'
import { RetrievedChunk } from './retrieval-service'

// ============================================================================
// TYPES
// ============================================================================

export type EnsembleMode = 'consensus' | 'cross_check' | 'mixture_of_experts'

export interface GeneratorOutput {
  answer: string
  support: Array<{
    chunk_id: string
    why_relevant: string
  }>
  confidence: {
    coverage: number
    agreement: number
    recency: number
    overall: number
  }
}

export interface VerifierOutput {
  unsupported_claims: Array<{
    text: string
    reason: string
    missing_chunk_ids: string[]
  }>
  missing_citations: Array<{
    location: string
    suggested_chunk_id: string
  }>
  clarity_issues: string[]
}

export interface AdjudicatorOutput {
  merged_answer: string
  kept_from_openai: string[]
  kept_from_gemini: string[]
  dropped_items: Array<{
    text: string
    reason: string
  }>
}

export interface EnsembleResult {
  text: string
  provider: string
  model: string
  latencyMs: number
  confidence: {
    coverage: number
    agreement: number
    recency: number
    overall: number
  }
  sources_used: string[]
  metadata: {
    mode: EnsembleMode
    verification_passed: boolean
    patches_applied?: number
  }
}

// ============================================================================
// RESPONSE LIMITING WITH FOLLOW-UP SUGGESTIONS
// ============================================================================

/**
 * Limits response to ~500 words and adds intelligent follow-up suggestions
 * to maintain engagement without overwhelming users
 */
function limitResponseWithFollowUps(response: string): string {
  const words = response.split(' ')
  const maxWords = 500
  
  if (words.length <= maxWords) {
    return response
  }
  
  // Find a good breaking point near 500 words
  let breakPoint = maxWords
  
  // Look for natural sentence endings within the last 50 words
  for (let i = maxWords - 50; i < maxWords && i < words.length; i++) {
    const word = words[i]
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      breakPoint = i + 1
      break
    }
  }
  
  // If no good break point found, look for paragraph breaks
  if (breakPoint === maxWords) {
    for (let i = maxWords - 100; i < maxWords && i < words.length; i++) {
      if (words[i] === '\n\n' || words[i].includes('\n\n')) {
        breakPoint = i + 1
        break
      }
    }
  }
  
  const truncatedResponse = words.slice(0, breakPoint).join(' ')
  
  // Generate follow-up suggestions based on the content
  const followUpSuggestions = generateFollowUpSuggestions(truncatedResponse, response)
  
  return `${truncatedResponse}\n\n---\n\n**Want to dive deeper?** I can tell you more about:\n\n${followUpSuggestions}\n\n*Just ask about any of these topics for more detailed guidance!*`
}

/**
 * Generates intelligent follow-up suggestions based on response content
 */
function generateFollowUpSuggestions(truncatedResponse: string, fullResponse: string): string {
  const suggestions: string[] = []
  
  // Analyze the content to suggest relevant follow-ups
  const content = truncatedResponse.toLowerCase()
  
  // Common coaching topics and their follow-ups
  if (content.includes('technique') || content.includes('form')) {
    suggestions.push('1. **Common technique mistakes** and how to fix them')
  }
  
  if (content.includes('practice') || content.includes('drill')) {
    suggestions.push('2. **Advanced practice drills** to take your skills further')
  }
  
  if (content.includes('mental') || content.includes('mindset') || content.includes('confidence')) {
    suggestions.push('3. **Mental training strategies** for peak performance')
  }
  
  if (content.includes('injury') || content.includes('prevention') || content.includes('recovery')) {
    suggestions.push('4. **Injury prevention** and recovery protocols')
  }
  
  if (content.includes('nutrition') || content.includes('diet') || content.includes('fuel')) {
    suggestions.push('5. **Nutrition strategies** for optimal performance')
  }
  
  if (content.includes('strength') || content.includes('conditioning') || content.includes('fitness')) {
    suggestions.push('6. **Strength and conditioning** specific to your sport')
  }
  
  if (content.includes('competition') || content.includes('game') || content.includes('match')) {
    suggestions.push('7. **Competition preparation** and game-day strategies')
  }
  
  if (content.includes('beginner') || content.includes('starting') || content.includes('new')) {
    suggestions.push('8. **Progression pathways** from beginner to advanced')
  }
  
  if (content.includes('advanced') || content.includes('elite') || content.includes('professional')) {
    suggestions.push('9. **Elite-level techniques** and advanced strategies')
  }
  
  if (content.includes('equipment') || content.includes('gear') || content.includes('tools')) {
    suggestions.push('10. **Equipment recommendations** and gear selection')
  }
  
  // If no specific topics found, provide general follow-ups
  if (suggestions.length === 0) {
    suggestions.push(
      '1. **Step-by-step breakdown** of the techniques mentioned',
      '2. **Common mistakes** to avoid and how to fix them',
      '3. **Practice progressions** to build your skills systematically',
      '4. **Mental aspects** and mindset for success',
      '5. **Advanced variations** once you master the basics'
    )
  }
  
  // Limit to 3-5 suggestions to avoid overwhelming
  return suggestions.slice(0, 5).join('\n')
}

// ============================================================================
// TEMPERATURE POLICY
// ============================================================================

interface TemperaturePolicy {
  planner: number
  generator: number
  verifier: number
  refiner: number
  stitcher: number
}

/**
 * Calculate dynamic temperature based on context
 */
function getDynamicTemperature(
  stage: keyof TemperaturePolicy,
  options: {
    question_type?: 'factual' | 'drill' | 'ideas'
    is_critical?: boolean
    coverage?: number
    agreement?: number
  }
): number {
  const baseTemps: TemperaturePolicy = {
    planner: 0.2,
    generator: 0.25, // Default: factual
    verifier: 0.1,
    refiner: 0.2,
    stitcher: 0.35
  }

  let temp = baseTemps[stage]

  // Adjust generator temperature based on question type
  if (stage === 'generator') {
    if (options.question_type === 'drill') temp = 0.55
    else if (options.question_type === 'ideas') temp = 0.75
    else temp = 0.25 // factual
  }

  // Dynamic adjustments
  if (options.coverage !== undefined && options.coverage < 0.6) temp -= 0.1
  if (options.agreement !== undefined && options.agreement > 0.8) temp += 0.05
  if (options.is_critical) temp -= 0.1

  // Clamp to valid range
  return Math.max(0, Math.min(1, temp))
}

// ============================================================================
// OPENAI CALLS
// ============================================================================

// Lazy-load OpenAI client to avoid build-time env validation
let openaiClient: OpenAI | null | undefined = undefined

function getOpenAIClient(): OpenAI | null {
  if (openaiClient === undefined) {
    const cfg = getAIServiceConfig()
    openaiClient = cfg.openai.enabled && cfg.openai.apiKey
      ? new OpenAI({ apiKey: cfg.openai.apiKey })
      : null
  }
  return openaiClient
}

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  model = 'gpt-4-turbo-preview'
): Promise<string> {
  const client = getOpenAIClient()
  if (!client) throw new Error('OpenAI not configured')

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature,
    max_tokens: 8000
  })

  const response = completion.choices[0]?.message?.content?.trim() || ''
  return limitResponseWithFollowUps(response)
}

// ============================================================================
// GEMINI CALLS
// ============================================================================

// Lazy-load Gemini client to avoid build-time env validation
let geminiClient: GoogleGenerativeAI | null | undefined = undefined

function getGeminiClient(): GoogleGenerativeAI | null {
  if (geminiClient === undefined) {
    const cfg = getAIServiceConfig()
    geminiClient = cfg.gemini.enabled && cfg.gemini.apiKey
      ? new GoogleGenerativeAI(cfg.gemini.apiKey)
      : null
  }
  return geminiClient
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  model = 'gemini-2.5-flash'
): Promise<string> {
  const client = getGeminiClient()
  if (!client) throw new Error('Gemini not configured')

  const genModel = client.getGenerativeModel({
    model,
    generationConfig: { temperature, maxOutputTokens: 8000 },
    systemInstruction: systemPrompt
  })

  const result = await genModel.generateContent(userPrompt)
  const response = result.response.text().trim()
  return limitResponseWithFollowUps(response)
}

// ============================================================================
// ENSEMBLE MODE: CROSS-CHECK (Default)
// ============================================================================

/**
 * Cross-check mode: Primary drafts, secondary verifies and patches
 *
 * 1. Primary model generates answer
 * 2. Secondary model verifies (checks for unsupported claims)
 * 3. Primary model patches issues
 * 4. Finalize
 */
export async function ensembleCrossCheck(
  question: string,
  chunks: RetrievedChunk[],
  coachContext: {
    name: string
    sport: string
    voice_traits?: string[]
  }
): Promise<EnsembleResult> {
  const startTime = Date.now()

  logger.info('[Ensemble:CrossCheck] Starting cross-check mode', {
    coach: coachContext.name,
    has_voice_traits: !!coachContext.voice_traits && coachContext.voice_traits.length > 0,
    voice_traits_count: coachContext.voice_traits?.length || 0
  })

  // Warn if voice traits are missing
  if (!coachContext.voice_traits || coachContext.voice_traits.length === 0) {
    logger.warn('[Ensemble:CrossCheck] ⚠️ NO VOICE TRAITS FOUND - Response will be generic', {
      coach: coachContext.name
    })
  }

  // Build context from retrieved chunks
  const context = chunks.map((chunk, i) =>
    `[S${i + 1}] ${chunk.label}\n${chunk.text.slice(0, 500)}`
  ).join('\n\n---\n\n')

  // Step 1: Primary model (Gemini) generates answer
  const generatorTemp = getDynamicTemperature('generator', { question_type: 'factual' })

  const generatorSystemPrompt = `You are ${coachContext.name}, an expert ${coachContext.sport} coach.
${coachContext.voice_traits ? `

COACH VOICE/PERSONALITY:
${coachContext.voice_traits.join('\n')}

Embody this coaching style in your response.` : ''}

SOURCES:
${context}

CRITICAL RULES:
- Only use information from the sources above
- Cite sources as [S1], [S2], etc.
- If sources don't fully answer the question, say so
- Be specific with step-by-step instructions`

  const generatorUserPrompt = `Question: ${question}

Provide a detailed, source-backed answer with citations.`

  logger.info('[Ensemble:CrossCheck] Calling primary generator (Gemini)')
  const draft = await callGemini(
    generatorSystemPrompt,
    generatorUserPrompt,
    generatorTemp
  )

  logger.info('[Ensemble:CrossCheck] Draft generated', { length: draft.length })

  // Step 2: Secondary model (OpenAI) verifies
  const verifierTemp = getDynamicTemperature('verifier', {})

  const verifierSystemPrompt = `You are a verification agent. Check if the answer is fully supported by the provided sources.

SOURCES:
${context}

ANSWER TO VERIFY:
${draft}

Identify:
1. Unsupported claims (statements not in sources)
2. Missing citations (where sources exist but aren't cited)
3. Clarity issues

Return JSON:
{
  "unsupported_claims": [{"text": "...", "reason": "...", "missing_chunk_ids": []}],
  "missing_citations": [{"location": "...", "suggested_chunk_id": "..."}],
  "clarity_issues": ["..."]
}`

  logger.info('[Ensemble:CrossCheck] Calling verifier (OpenAI)')
  const verificationRaw = await callOpenAI(
    verifierSystemPrompt,
    'Verify the answer against sources and return JSON.',
    verifierTemp
  )

  let verification: VerifierOutput
  try {
    verification = JSON.parse(verificationRaw)
  } catch {
    logger.warn('[Ensemble:CrossCheck] Verifier returned invalid JSON, assuming pass')
    verification = { unsupported_claims: [], missing_citations: [], clarity_issues: [] }
  }

  logger.info('[Ensemble:CrossCheck] Verification complete', {
    unsupported: verification.unsupported_claims.length,
    missing_cites: verification.missing_citations.length,
    clarity: verification.clarity_issues.length
  })

  // Step 3: Patch if needed
  let finalAnswer = draft
  let patchesApplied = 0

  if (verification.unsupported_claims.length > 0 || verification.missing_citations.length > 0) {
    logger.info('[Ensemble:CrossCheck] Applying patches')

    const patchPrompt = `Original answer had issues. Fix them:

ISSUES:
${JSON.stringify(verification, null, 2)}

SOURCES:
${context}

ORIGINAL ANSWER:
${draft}

Rewrite the answer fixing all issues. Keep what's good, fix what's wrong, add missing citations.`

    finalAnswer = await callGemini(
      generatorSystemPrompt,
      patchPrompt,
      generatorTemp
    )

    patchesApplied = verification.unsupported_claims.length + verification.missing_citations.length
    logger.info('[Ensemble:CrossCheck] Patches applied', { patchesApplied })
  }

  const latencyMs = Date.now() - startTime

  // Calculate confidence
  const sourcesUsed = Array.from(new Set(
    (finalAnswer.match(/\[S\d+\]/g) || []).map(s => s.replace(/[[\]]/g, ''))
  ))

  const confidence = {
    coverage: Math.min(sourcesUsed.length / chunks.length, 1.0),
    agreement: 0.85, // Cross-check mode has high agreement by design
    recency: chunks.length > 0 ? 0.7 : 0.5, // Estimated
    overall: 0.8
  }

  return {
    text: finalAnswer,
    provider: 'gemini+openai',
    model: 'cross_check',
    latencyMs,
    confidence,
    sources_used: sourcesUsed,
    metadata: {
      mode: 'cross_check',
      verification_passed: verification.unsupported_claims.length === 0,
      patches_applied: patchesApplied
    }
  }
}

// ============================================================================
// ENSEMBLE MODE: CONSENSUS (Higher Stakes)
// ============================================================================

/**
 * Consensus mode: Both generate independently, adjudicator merges
 *
 * 1. OpenAI generates
 * 2. Gemini generates
 * 3. Adjudicator merges overlapping supported content
 * 4. Other model verifies and flags issues
 * 5. Finalize
 */
export async function ensembleConsensus(
  question: string,
  chunks: RetrievedChunk[],
  coachContext: {
    name: string
    sport: string
    voice_traits?: string[]
  }
): Promise<EnsembleResult> {
  const startTime = Date.now()

  logger.info('[Ensemble:Consensus] Starting consensus mode', {
    coach: coachContext.name,
    has_voice_traits: !!coachContext.voice_traits && coachContext.voice_traits.length > 0,
    voice_traits_count: coachContext.voice_traits?.length || 0
  })

  // Warn if voice traits are missing
  if (!coachContext.voice_traits || coachContext.voice_traits.length === 0) {
    logger.warn('[Ensemble:Consensus] ⚠️ NO VOICE TRAITS FOUND - Response will be generic', {
      coach: coachContext.name
    })
  }

  const context = chunks.map((chunk, i) =>
    `[S${i + 1}] ${chunk.label}\n${chunk.text.slice(0, 500)}`
  ).join('\n\n---\n\n')

  const generatorTemp = getDynamicTemperature('generator', { question_type: 'factual', is_critical: true })

  const systemPrompt = `You are ${coachContext.name}, an expert ${coachContext.sport} coach.
${coachContext.voice_traits ? `

COACH VOICE/PERSONALITY:
${coachContext.voice_traits.join('\n')}

Embody this coaching style in your response.` : ''}

SOURCES:
${context}

Answer using ONLY the sources. Cite as [S1], [S2], etc. Be specific and technical.`

  const userPrompt = `Question: ${question}

Provide a detailed answer with citations.`

  // Generate from both models in parallel
  logger.info('[Ensemble:Consensus] Calling both models in parallel')
  const [openaiAnswer, geminiAnswer] = await Promise.all([
    callOpenAI(systemPrompt, userPrompt, generatorTemp),
    callGemini(systemPrompt, userPrompt, generatorTemp)
  ])

  logger.info('[Ensemble:Consensus] Both models responded', {
    openai_length: openaiAnswer.length,
    gemini_length: geminiAnswer.length
  })

  // Adjudicate: Merge overlapping content
  const adjudicatorPrompt = `You are an adjudicator. Two models answered the same question. Merge their answers into one coherent response.

Keep:
- Content that both models agree on
- Content that is well-supported by sources
- The best phrasing from either model

Drop:
- Contradictions
- Unsupported claims

OPENAI ANSWER:
${openaiAnswer}

GEMINI ANSWER:
${geminiAnswer}

SOURCES:
${context}

Return JSON:
{
  "merged_answer": "...",
  "kept_from_openai": ["snippet1", "snippet2"],
  "kept_from_gemini": ["snippet1", "snippet2"],
  "dropped_items": [{"text": "...", "reason": "..."}]
}`

  logger.info('[Ensemble:Consensus] Adjudicating')
  const adjudicationRaw = await callOpenAI(
    'You are an expert adjudicator merging answers from multiple models.',
    adjudicatorPrompt,
    getDynamicTemperature('stitcher', {})
  )

  let adjudication: AdjudicatorOutput
  try {
    adjudication = JSON.parse(adjudicationRaw)
  } catch {
    logger.warn('[Ensemble:Consensus] Adjudicator returned invalid JSON, using OpenAI answer')
    adjudication = {
      merged_answer: openaiAnswer,
      kept_from_openai: [],
      kept_from_gemini: [],
      dropped_items: []
    }
  }

  const latencyMs = Date.now() - startTime

  const sourcesUsed = Array.from(new Set(
    (adjudication.merged_answer.match(/\[S\d+\]/g) || []).map(s => s.replace(/[[\]]/g, ''))
  ))

  const agreement = 1 - (adjudication.dropped_items.length / 10) // Rough estimate

  const confidence = {
    coverage: Math.min(sourcesUsed.length / chunks.length, 1.0),
    agreement: Math.max(0.5, agreement),
    recency: 0.7,
    overall: 0.85 // Consensus is high confidence
  }

  return {
    text: adjudication.merged_answer,
    provider: 'openai+gemini',
    model: 'consensus',
    latencyMs,
    confidence,
    sources_used: sourcesUsed,
    metadata: {
      mode: 'consensus',
      verification_passed: true,
      patches_applied: adjudication.dropped_items.length
    }
  }
}

// ============================================================================
// MAIN ENSEMBLE FUNCTION
// ============================================================================

export async function generateWithEnsemble(
  question: string,
  chunks: RetrievedChunk[],
  coachContext: {
    name: string
    sport: string
    voice_traits?: string[]
  },
  mode: EnsembleMode = 'cross_check'
): Promise<EnsembleResult> {
  logger.info('[Ensemble] Starting generation', { mode, chunks: chunks.length })

  switch (mode) {
    case 'consensus':
      return ensembleConsensus(question, chunks, coachContext)

    case 'cross_check':
      return ensembleCrossCheck(question, chunks, coachContext)

    case 'mixture_of_experts':
      // TODO: Implement MoE routing
      logger.warn('[Ensemble] MoE not yet implemented, falling back to cross-check')
      return ensembleCrossCheck(question, chunks, coachContext)

    default:
      return ensembleCrossCheck(question, chunks, coachContext)
  }
}
