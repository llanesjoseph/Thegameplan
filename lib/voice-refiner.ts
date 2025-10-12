/**
 * Voice Refiner - Coach Voice Preservation
 *
 * Applies coach-specific voice characteristics to generated answers
 * while preserving factual accuracy and citations.
 */

import { adminDb } from './firebase.admin'
import OpenAI from 'openai'
import { getAIServiceConfig } from './env-validation'
import { logger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface CoachVoiceProfile {
  coach_id: string
  version: number
  catchphrases: string[]
  preferred_terms: string[]
  banned_terms: string[]
  tone: string
  sentence_structure: {
    mean_length: number
    std_dev: number
    imperative_ratio: number // % of imperative sentences
  }
  style_snippets: Array<{
    id: string
    text: string
    tags: string[]
  }>
}

// ============================================================================
// VOICE PROFILE LOADING
// ============================================================================

/**
 * Load coach voice profile from Firestore
 */
export async function loadCoachVoiceProfile(
  coach_id: string
): Promise<CoachVoiceProfile | null> {
  try {
    const profileDoc = await adminDb
      .collection('coach_voice_profiles')
      .doc(coach_id)
      .get()

    if (!profileDoc.exists) {
      logger.warn('[VoiceRefiner] No voice profile found, using defaults', { coach_id })
      return null
    }

    const data = profileDoc.data() as CoachVoiceProfile
    logger.info('[VoiceRefiner] Loaded voice profile', {
      coach_id,
      version: data.version,
      catchphrases_count: data.catchphrases?.length || 0
    })

    return data

  } catch (error) {
    logger.error('[VoiceRefiner] Error loading voice profile', { error, coach_id })
    return null
  }
}

// ============================================================================
// DEFAULT VOICE PROFILES (Fallback)
// ============================================================================

const DEFAULT_PROFILES: Record<string, Partial<CoachVoiceProfile>> = {
  'default': {
    catchphrases: ['Let\'s break this down', 'Here\'s what you need to know', 'Practice this drill'],
    preferred_terms: ['technique', 'fundamentals', 'positioning'],
    banned_terms: ['maybe', 'kind of', 'sort of'],
    tone: 'encouraging but direct',
    sentence_structure: {
      mean_length: 15,
      std_dev: 5,
      imperative_ratio: 0.4
    }
  }
}

function getDefaultProfile(coach_id: string): Partial<CoachVoiceProfile> {
  return DEFAULT_PROFILES['default']
}

// ============================================================================
// VOICE REFINEMENT
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

/**
 * Refine answer to match coach's voice while preserving facts and citations
 */
export async function refineToCoachVoice(
  rawAnswer: string,
  coachContext: {
    name: string
    sport: string
    coach_id: string
  }
): Promise<string> {
  const client = getOpenAIClient()
  if (!client) {
    logger.warn('[VoiceRefiner] OpenAI not available, skipping voice refinement')
    return rawAnswer
  }

  try {
    // Load voice profile
    let profile = await loadCoachVoiceProfile(coachContext.coach_id)

    // Fallback to defaults if no profile
    if (!profile) {
      profile = {
        coach_id: coachContext.coach_id,
        version: 1,
        ...getDefaultProfile(coachContext.coach_id)
      } as CoachVoiceProfile
    }

    logger.info('[VoiceRefiner] Refining answer to coach voice')

    // Build voice refinement prompt
    const systemPrompt = `You are a voice refinement specialist. Rewrite the answer to match ${coachContext.name}'s coaching voice.

VOICE CHARACTERISTICS:
- Tone: ${profile.tone || 'encouraging but direct'}
- Catchphrases: ${profile.catchphrases?.slice(0, 5).join(', ') || 'None specified'}
- Preferred terms: ${profile.preferred_terms?.slice(0, 10).join(', ') || 'None specified'}
- Avoid: ${profile.banned_terms?.join(', ') || 'vague language'}
- Sentence style: ${profile.sentence_structure ? `Average ${profile.sentence_structure.mean_length} words, ${Math.round(profile.sentence_structure.imperative_ratio * 100)}% imperatives` : 'conversational'}

CRITICAL RULES:
1. Preserve ALL factual information
2. Keep ALL citations [S1], [S2], etc. in the exact same places
3. DO NOT add new information
4. DO NOT remove technical details
5. ONLY adjust phrasing, tone, and style to match the coach's voice

${profile.style_snippets && profile.style_snippets.length > 0 ? `
EXAMPLE COACH PHRASES:
${profile.style_snippets.slice(0, 3).map(s => `- "${s.text}"`).join('\n')}
` : ''}`

    const userPrompt = `Rewrite this answer in ${coachContext.name}'s voice:

${rawAnswer}

Remember: Keep facts, keep citations, only change style.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, // Low temp for style consistency
      max_tokens: 2000
    })

    const refined = completion.choices[0]?.message?.content?.trim() || rawAnswer

    logger.info('[VoiceRefiner] Voice refinement complete', {
      before_length: rawAnswer.length,
      after_length: refined.length
    })

    return refined

  } catch (error) {
    logger.error('[VoiceRefiner] Error during voice refinement', { error })
    return rawAnswer // Fall back to unrefined answer
  }
}

// ============================================================================
// VOICE PROFILE CREATION (Admin Function)
// ============================================================================

/**
 * Analyze coach's existing content to extract voice characteristics
 * (This would be called by admin tools to build voice profiles)
 */
export async function analyzeCoachVoice(
  coach_id: string
): Promise<Partial<CoachVoiceProfile>> {
  try {
    logger.info('[VoiceRefiner] Analyzing coach voice', { coach_id })

    // Fetch coach's lessons
    const lessonsSnapshot = await adminDb
      .collection('lessons')
      .where('userId', '==', coach_id)
      .where('status', '==', 'active')
      .limit(20) // Sample recent lessons
      .get()

    if (lessonsSnapshot.empty) {
      logger.warn('[VoiceRefiner] No lessons found for voice analysis', { coach_id })
      return getDefaultProfile(coach_id)
    }

    // Extract text samples
    const samples: string[] = []
    lessonsSnapshot.forEach(doc => {
      const lesson = doc.data()
      if (lesson.content?.description) samples.push(lesson.content.description)
      if (lesson.content?.steps) {
        lesson.content.steps.forEach((step: any) => {
          if (step.instruction) samples.push(step.instruction)
        })
      }
    })

    if (samples.length === 0) {
      logger.warn('[VoiceRefiner] No text samples found', { coach_id })
      return getDefaultProfile(coach_id)
    }

    // Use AI to analyze voice characteristics
    const client = getOpenAIClient()
    if (!client) {
      logger.warn('[VoiceRefiner] OpenAI not available, using defaults')
      return getDefaultProfile(coach_id)
    }

    const analysisPrompt = `Analyze these coaching text samples and extract voice characteristics.

SAMPLES:
${samples.slice(0, 10).map((s, i) => `${i + 1}. ${s.slice(0, 200)}`).join('\n\n')}

Return JSON:
{
  "catchphrases": ["phrase1", "phrase2"],
  "preferred_terms": ["term1", "term2"],
  "banned_terms": ["avoid1", "avoid2"],
  "tone": "description of tone",
  "sentence_structure": {
    "mean_length": 15,
    "std_dev": 5,
    "imperative_ratio": 0.4
  }
}`

    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a linguistic analyst extracting voice characteristics.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const analysisRaw = completion.choices[0]?.message?.content?.trim() || '{}'

    try {
      const analysis = JSON.parse(analysisRaw)
      logger.info('[VoiceRefiner] Voice analysis complete', { coach_id, analysis })
      return analysis
    } catch {
      logger.warn('[VoiceRefiner] Failed to parse voice analysis, using defaults')
      return getDefaultProfile(coach_id)
    }

  } catch (error) {
    logger.error('[VoiceRefiner] Error analyzing coach voice', { error, coach_id })
    return getDefaultProfile(coach_id)
  }
}

/**
 * Save voice profile to Firestore
 */
export async function saveCoachVoiceProfile(
  profile: CoachVoiceProfile
): Promise<void> {
  try {
    await adminDb
      .collection('coach_voice_profiles')
      .doc(profile.coach_id)
      .set(profile, { merge: true })

    logger.info('[VoiceRefiner] Voice profile saved', {
      coach_id: profile.coach_id,
      version: profile.version
    })

  } catch (error) {
    logger.error('[VoiceRefiner] Error saving voice profile', { error })
    throw new Error('Failed to save voice profile')
  }
}
