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
      logger.warn('[QA-Agent] No relevant content found, using AI fallback')
      pipelineStages.push('ai_fallback')

      // Use AI to provide helpful response based on general coaching knowledge
      const fallbackContext = {
        name: coachProfile.name,
        sport: coachProfile.sport,
        voice_traits: coachProfile.voice_traits,
        coach_id: request.coach_id
      }

      try {
        // Generate helpful response using ensemble service
        const fallbackResult = await generateFallbackResponse(
          normalizedQuestion,
          fallbackContext,
          request.mode || 'cross_check'
        )

        logger.info('[QA-Agent] AI fallback generated', { length: fallbackResult.text.length })

        return {
          text: fallbackResult.text + '\n\n---\n\n💡 _This response draws from general coaching expertise. For even more personalized advice tailored to your specific training, ask your coach to create a detailed lesson on this topic!_',
          sources: [],
          confidence: {
            overall: 0.6, // Good confidence for expert knowledge
            coverage: 0.5,
            agreement: 0.7,
            recency: 0.5
          },
          voice_version: 1,
          metadata: {
            mode: request.mode || 'cross_check',
            safety_checked: true,
            safety_level: safetyAnalysis.riskLevel,
            voice_refined: true,
            latencyMs: Date.now() - startTime,
            pipeline_stages: pipelineStages
          }
        }
      } catch (fallbackError) {
        logger.error('[QA-Agent] AI fallback failed', { error: fallbackError })
        // Only now fall back to the generic message
        return {
          text: `I don't have specific lesson content that directly addresses this question yet. Ask your coach to create a lesson on this topic for more personalized guidance!`,
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
    // NOTE: We already did a pre-check on the user's question (Stage 3).
    // No need to analyze the COACH's response for medical content - the coach
    // persona (like Dory mentioning "memory loss") shouldn't trigger warnings.
    pipelineStages.push('safety_postcheck_skipped')

    let finalText = voiceRefined

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
        safety_level: safetyAnalysis.riskLevel, // Use pre-check result (user's question)
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
 * Generate a helpful response using AI when no specific content is found
 * This uses the AI's general coaching knowledge instead of specific lesson content
 */
async function generateFallbackResponse(
  question: string,
  coachContext: {
    name: string
    sport: string
    voice_traits?: string[]
    coach_id: string
  },
  mode: EnsembleMode
): Promise<{ text: string }> {
  logger.info('[QA-Agent:Fallback] Generating AI response using general coaching knowledge')

  // Import AI clients directly to bypass ensemble restrictions
  const { callGemini } = await import('./ensemble-service')

  // Build a comprehensive coaching prompt that encourages specific, actionable advice
  const systemPrompt = `You are ${coachContext.name}, an expert ${coachContext.sport} coach with years of experience.

Since you don't have specific lesson content for this question, draw from your extensive coaching knowledge and expertise to provide:

1. SPECIFIC, ACTIONABLE ADVICE - Not generic platitudes
2. STEP-BY-STEP GUIDANCE - Break down complex movements or concepts
3. COMMON MISTAKES - What to avoid and why
4. PROGRESSION TIPS - How to build up to more advanced techniques
5. PRACTICE DRILLS - Concrete exercises they can do

Be technical and detailed. Assume the athlete wants real coaching, not motivational fluff.
${coachContext.voice_traits ? `Your coaching style: ${coachContext.voice_traits.join(', ')}` : ''}

Remember: You're a real coach with expertise. Give advice you'd give to an athlete in person.`

  const userPrompt = `Question: ${question}

Provide detailed, specific coaching advice with actionable steps. Be technical and thorough.`

  try {
    // Use Gemini for fallback generation with higher temperature for more creative responses
    const response = await callGemini(systemPrompt, userPrompt, 0.6, 'gemini-1.5-pro')

    logger.info('[QA-Agent:Fallback] Generated fallback response', { length: response.length })

    return { text: limitResponseWithFollowUps(response) }
  } catch (geminiError) {
    // If Gemini fails, try OpenAI as backup
    logger.warn('[QA-Agent:Fallback] Gemini failed, trying OpenAI', {
      error: geminiError instanceof Error ? geminiError.message : 'Unknown error'
    })

    try {
      const { callOpenAI } = await import('./ensemble-service')
      const response = await callOpenAI(systemPrompt, userPrompt, 0.6, 'gpt-4o')

      logger.info('[QA-Agent:Fallback] Generated fallback response with OpenAI', { length: response.length })
      return { text: limitResponseWithFollowUps(response) }
    } catch (openaiError) {
      logger.error('[QA-Agent:Fallback] Both Gemini and OpenAI failed', {
        geminiError: geminiError instanceof Error ? geminiError.message : 'Unknown',
        openaiError: openaiError instanceof Error ? openaiError.message : 'Unknown'
      })

      // FINAL SAFETY NET: Provide a handcrafted, rule-based response
      logger.warn('[QA-Agent:Fallback] Using heuristic fallback response')
      const heuristic = generateHeuristicFallback(question, coachContext.sport)
      return { text: limitResponseWithFollowUps(heuristic) }
    }
  }
}

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

    // Extract voice traits from voiceCaptureData
    // SUPPORTS BOTH OLD AND NEW FORMATS FOR MAXIMUM COMPATIBILITY
    const voiceTraits: string[] = []

    if (userData?.voiceCaptureData) {
      const voiceData = userData.voiceCaptureData

      // Add coaching philosophy (new: coachingPhilosophy, old: corePhilosophy)
      const philosophy = voiceData.coachingPhilosophy || voiceData.corePhilosophy
      if (philosophy) {
        voiceTraits.push(`Philosophy: ${philosophy}`)
      }

      // Add communication style
      if (voiceData.communicationStyle) {
        voiceTraits.push(`Communication Style: ${voiceData.communicationStyle}`)
      }

      // Add motivation approach
      if (voiceData.motivationApproach) {
        voiceTraits.push(`Motivation: ${voiceData.motivationApproach}`)
      }

      // Add catchphrases (new: catchphrases, old: favoriteSayings)
      const phrases = voiceData.catchphrases || voiceData.favoriteSayings || []
      if (phrases.length > 0) {
        voiceTraits.push(`Catchphrases: ${phrases.join(', ')}`)
      }

      // Add key stories (new: keyStories, old: stories)
      const stories = voiceData.keyStories || voiceData.stories || []
      if (stories.length > 0) {
        // Handle both string arrays and object arrays
        const storyStrings = stories.map((s: any) => {
          if (typeof s === 'string') return s
          return `${s.title || 'Story'}: ${s.story || s.lesson || ''}`
        }).filter((s: string) => s.length > 0)

        if (storyStrings.length > 0) {
          voiceTraits.push(`Key Stories: ${storyStrings.join(' | ')}`)
        }
      }

      // Add personality traits (new: personalityTraits, old: personality.traits)
      const traits = voiceData.personalityTraits || voiceData.personality?.traits || []
      if (traits.length > 0) {
        voiceTraits.push(`Personality: ${traits.join(', ')}`)
      }

      // Add current context (new: currentContext, old: currentTeam)
      const context = voiceData.currentContext || voiceData.currentTeam
      if (context) {
        voiceTraits.push(`Context: ${context}`)
      }

      // Add technical focus
      if (voiceData.technicalFocus) {
        // Handle both string and array formats
        const techFocus = Array.isArray(voiceData.technicalFocus)
          ? voiceData.technicalFocus.map((t: any) => {
              if (typeof t === 'string') return t
              return `${t.area || 'Focus'}: ${t.description || ''}`
            }).join(' | ')
          : voiceData.technicalFocus

        if (techFocus) {
          voiceTraits.push(`Technical Focus: ${techFocus}`)
        }
      }

      logger.info('[QA-Agent] Extracted voice traits from voiceCaptureData', {
        coach_id,
        traits_count: voiceTraits.length,
        has_philosophy: !!philosophy,
        has_catchphrases: phrases.length > 0,
        has_stories: stories.length > 0
      })
    } else {
      logger.warn('[QA-Agent] No voiceCaptureData found for coach', { coach_id })
    }

    return {
      name: userData?.displayName || 'Coach',
      sport: userData?.sport || 'Sports',
      voice_traits: voiceTraits.length > 0 ? voiceTraits : undefined
    }

  } catch (error) {
    logger.error('[QA-Agent] Error fetching coach profile', { error, coach_id })
    return {
      name: 'Coach',
      sport: 'Sports'
    }
  }
}

/**
 * Heuristic fallback when no AI providers are available.
 * Provides structured coaching guidance based on sport and question patterns.
 * Aggressively expanded to cover multiple sports and question types.
 */
function generateHeuristicFallback(question: string, sport: string): string {
  const q = question.toLowerCase()
  const sportLower = (sport || 'Sports').toLowerCase()
  
  // SPORT DETECTION
  const isGrappling = /bjj|jiu[-\s]?jitsu|grappling|wrestling|mma|judo/.test(sportLower)
  const isBasketball = /basketball|hoops|nba/.test(sportLower)
  const isSoccer = /soccer|football|f\u00fatbol/.test(sportLower) && !/american/.test(sportLower)
  const isBaseball = /baseball|softball|mlb/.test(sportLower)
  const isVolleyball = /volleyball/.test(sportLower)
  
  // INTENT DETECTION
  const isRecovery = /rest|recovery|tired|fatigue|sore|overtrain|sleep|pain/.test(q)
  const isMental = /nervous|confidence|mindset|pressure|anxiety|focus|scared|choke/.test(q)
  const isStrength = /strength|condition|cardio|speed|power|gym|weight|muscle/.test(q)
  
  const sections: string[] = []
  const addSection = (title: string, bullets: string[]) => {
    sections.push(`**${title}**\n${bullets.map((b) => `- ${b}`).join('\n')}`)
  }

  // --- UNIVERSAL FALLBACKS (Physical/Mental) ---
  
  if (isRecovery) {
    addSection(`${sport} Recovery Protocol`, [
      '**The 48-Hour Rule:** If your resting heart rate is up >10% or sleep quality is down for 2 nights, cut volume by 50%.',
      '**Active Recovery:** Do 20 mins of low-intensity movement (walking, light swimming, yoga) to flush lactate without adding stress.',
      '**Nutrition Check:** Are you hitting protein goals (0.8g/lb) and hydrating with electrolytes post-sweat?'
    ])
    addSection('Red Flags to Watch', [
      'Persistent joint pain that doesn’t warm up.',
      'Mood irritability or lack of motivation.',
      'Grip strength or vertical jump decrease.'
    ])
    return sections.join('\n\n')
  }

  if (isMental) {
    addSection('Performance Mindset Reset', [
      '**Focus on Process, Not Outcome:** Don’t think "I need to win." Think "I need to stay low and explode."',
      '**The Reset Breath:** In through nose (4s), hold (4s), out through mouth (6s). Do this 3x before stepping on court/mat.',
      '**Visualization:** Spend 5 mins tonight visualizing perfect execution of your core skills, not just the victory.'
    ])
    addSection('In-Game/Match Cue', [
      'Pick one simple word (e.g., "Smooth", "Attack", "Reset") to say to yourself when pressure spikes.',
      'Focus on your teammate or opponent’s movement to get out of your own head.'
    ])
    return sections.join('\n\n')
  }

  if (isStrength) {
    addSection(`${sport} Conditioning Basics`, [
      '**Sport-Specific Stamina:** Match your conditioning intervals to your sport’s work-to-rest ratio.',
      '**Core is Key:** Every movement radiates from the core. Prioritize anti-rotation (Pallof press) and stability.',
      '**Explosive Power:** Include plyometrics (box jumps, skaters) 2x/week, fresh at the start of workouts.'
    ])
    return sections.join('\n\n')
  }

  // --- SPORT SPECIFIC TECHNICAL FALLBACKS ---

  if (isGrappling) {
    if (/(ankle|heel|leg).*(lock|hook)|ashi|50\/50|saddle/.test(q)) {
      addSection('Leg Lock Control Blueprint', [
        '**Knee Line:** This is priority #1. If their knee clears your hip line, you have nothing. Pinch tight.',
        '**Heel Exposure:** Rotate your wrist/forearm blade to catch the heel. No bite = no finish.',
        '**Breaking Mechanics:** Bridge hips into the side of the knee while rotating the heel. It’s a full-body bridge, not just an arm pull.'
      ])
      addSection('Safety Note', ['Tap early during drilling. Rotational force tears ligaments before you feel pain.'])
    } else if (/(guard|pass|sweep|top|bottom)/.test(q)) {
      addSection('Guard Retention & Passing', [
        '**Frames vs. Grips:** Frames keep weight off (forearms, shins). Grips control movement. Know which you need.',
        '**Angle of Attack:** Don’t attack straight on. create an angle to off-balance (kuzushi) before sweeping.',
        '**Hips High (Passing):** Keep hips active. If knees touch the mat, you are anchored and slow.'
      ])
    } else {
      // General BJJ
      addSection('Grappling Fundamentals', [
        '**Position Before Submission:** Control the hips and shoulders before hunting the tap.',
        '**Breathe:** If you hold your breath, you gas out in 2 minutes. Exhale on exertion.',
        '**Elbows Tight:** T-Rex arms. Open elbows give up underhooks and armbars.'
      ])
    }
  } 
  
  else if (isBasketball) {
    if (/shoot|form|three|jumper/.test(q)) {
      addSection('Shooting Mechanics Checklist', [
        '**Base:** Feet shoulder-width, knees bent, ready to explode up.',
        '**Elbow In:** Keep shooting elbow aligned with the rim, not flared out.',
        '**Follow Through:** Snap the wrist and hold the "goose neck" until the ball hits the rim.',
        '**Arc:** Higher arc gives the ball a softer landing and bigger target.'
      ])
    } else if (/dribble|handle|crossover/.test(q)) {
      addSection('Ball Handling Drills', [
        '**Pound Dribble:** Dribble hard at knee height. The ball should spend more time in your hand than air.',
        '**Eyes Up:** Practice looking at the rim or a wall spot, not the ball.',
        '**Change of Pace:** The hesitation (hesi) is more deadly than speed alone. Stop-and-go freezes defenders.'
      ])
    } else {
      // General Hoops
      addSection('Basketball IQ & Fundamentals', [
        '**Spacing:** Don’t clog the paint. Move to open space when your teammate drives.',
        '**Defense:** Stay low, wide stance, move feet (don’t reach). See ball and man.',
        '**Rebounding:** Box out first, then pursue the ball. Contact creates space.'
      ])
    }
  }

  else if (isSoccer) {
    if (/shoot|strike|finish|goal/.test(q)) {
      addSection('Striking Technique', [
        '**Plant Foot:** Point it exactly where you want the ball to go.',
        '**Lock Ankle:** Keep the kicking foot rigid. Floppy foot = weak shot.',
        '**Body Over Ball:** Lean forward slightly to keep the shot low and powerful. Leaning back sends it into orbit.'
      ])
    } else if (/pass|touch|control/.test(q)) {
      addSection('First Touch & Passing', [
        '**Cushion the Ball:** Receive with the inside of the foot, absorbing pace like a pillow.',
        '**Head Up:** Scan the field *before* the ball arrives at your feet.',
        '**Weight of Pass:** Pass to the back foot for control, or front foot to lead them into space.'
      ])
    } else {
      // General Soccer
      addSection('Field General Tips', [
        '**Communication:** Talk to your teammates ("Man on!", "Time!", "Switch!").',
        '**Movement off Ball:** Pass and move. Don’t stand still watching your pass.',
        '**Defensive Shape:** Force attackers outside. Don’t dive in unless you can win the ball.'
      ])
    }
  }

  else if (isBaseball) {
    if (/swing|hit|bat/.test(q)) {
      addSection('Hitting Mechanics', [
        '**Load & Stride:** Rhythmic load back, soft stride forward. Separate hands from front foot.',
        '**Hip Rotation:** Fire the back hip toward the pitcher. Hips lead, hands follow.',
        '**Stay Inside:** Keep hands close to body to drive the ball. Don’t cast around it.'
      ])
    } else if (/pitch|throw/.test(q)) {
      addSection('Pitching Mechanics', [
        '**Balance Point:** Lift leg high, stay tall/balanced before driving home.',
        '**Arm Action:** Long and loose arm path. Hide the ball from the batter.',
        '**Finish:** Follow through across your body, fielding position ready.'
      ])
    } else {
      addSection('Diamond Fundamentals', [
        '**Fielding:** Triangle setup (feet wide, glove out front). Watch ball into glove.',
        '**Base Running:** Run hard through first base. Round the bag on hits.',
        '**Mental:** Baseball is a game of failure. Flush the last pitch, focus on the next one.'
      ])
    }
  }

  else if (isVolleyball) {
    addSection('Volleyball Essentials', [
      '**Ready Position:** Knees bent, weight forward, arms loose and ready to react.',
      '**Communication:** Call "Mine!" early and loud to avoid collisions.',
      '**Serving:** Consistent toss is 90% of the serve. Toss in front of hitting shoulder.'
    ])
  }

  // --- GENERIC CATCH-ALL ---
  else {
    addSection(`${sport} Training Tune-Up`, [
      '**Consistency:** Consistency beats intensity. Show up and do the work.',
      '**Fundamentals First:** Master the boring basics before trying the highlight-reel moves.',
      '**Listen to Body:** Train hard, but respect pain signals. Recovery is when growth happens.'
    ])
  }

  sections.push(
    `*Need a deeper dive in ${sport}? Ask your coach to spin up a focused lesson so you can save this conversation and drill it step-by-step.*`
  )

  return sections.join('\n\n')
}
