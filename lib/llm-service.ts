import { CoachingContext, generateCoachingPrompt } from './ai-service'
import { getAIServiceConfig } from './env-validation'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

type ProviderName = 'gemini' | 'openai'

export interface LLMResult {
  text: string
  provider: ProviderName
  model: string
  latencyMs: number
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then((value) => {
      clearTimeout(timer)
      resolve(value)
    }).catch((err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

function getModelsFromEnv() {
  // Defaults align with current usage
  const openaiModel = process.env.AI_OPENAI_MODEL || 'gpt-4-turbo-preview'
  const geminiModel = process.env.AI_GEMINI_MODEL || 'gemini-1.5-flash'
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 10000)
  const primary = (process.env.AI_PRIMARY_PROVIDER as ProviderName) || 'gemini'
  return { openaiModel, geminiModel, timeoutMs, primary }
}

async function callOpenAI(question: string, context: CoachingContext, model: string): Promise<LLMResult> {
  const cfg = getAIServiceConfig()
  if (!cfg.openai.enabled || !cfg.openai.apiKey) {
    throw new Error('OpenAI not configured')
  }
  const client = new OpenAI({ apiKey: cfg.openai.apiKey })
  const prompt = generateCoachingPrompt(question, context)

  // ⚡ AGGRESSIVE ENHANCEMENT: Build comprehensive system message with lesson content
  // System messages have MORE WEIGHT in OpenAI - use this for mandatory instructions
  let systemMessage = `You are ${context.coachName}, an elite ${context.sport.toLowerCase()} coach and former player with these credentials: ${context.coachCredentials.join(', ')}.

YOUR COACHING IDENTITY:
- Personality: ${context.personalityTraits.join(', ')}
- Speaking style: ${context.voiceCharacteristics.speakingStyle}
- Your catchphrases: "${context.voiceCharacteristics.catchphrases.join('", "')}"

⚡ CRITICAL INSTRUCTION - YOU MUST BE SPECIFIC:
You must provide SPECIFIC, TECHNICAL, STEP-BY-STEP coaching advice. NEVER give generic or vague responses like "This is a complex subject...". Always ground your advice in concrete techniques, positions, and movements with numbered steps.`

  // ⚡ Add actual lesson content to system message for MAXIMUM IMPACT
  if (context.lessonContent && context.lessonContent.availableLessons.length > 0) {
    systemMessage += `

⚡ YOUR TEACHING CONTENT (MANDATORY - Reference this):
You have taught these specific lessons:
${context.lessonContent.availableLessons.slice(0, 5).map((lesson, i) => `${i + 1}. ${lesson}`).join('\n')}

Your specific techniques include: ${context.lessonContent.techniques.slice(0, 10).join(', ')}

MANDATORY: When answering questions, reference your actual lessons and give detailed breakdowns like you do in your teaching content. For example: "Based on my lesson on [Lesson Name], here's how I teach this technique: Step 1..."

NEVER give vague advice when you have specific lesson content available.`
  }

  systemMessage += `

Respond authentically in character with encouraging, SPECIFIC, TECHNICAL advice. Be conversational but always include:
- Concrete step-by-step instructions
- Specific positions, grips, or movements
- Common mistakes to avoid
- Reference to your actual teaching content when relevant`

  const start = Date.now()
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000, // ⚡ DOUBLED from 1000 to allow detailed, substantial responses
    temperature: 0.8, // ⚡ INCREASED from 0.7 for more creative, conversational responses
    top_p: 0.95, // ⚡ INCREASED from 0.9 for more diverse vocabulary
    presence_penalty: 0.3, // ⚡ NEW: Encourages introducing new topics/details
    frequency_penalty: 0.3 // ⚡ NEW: Reduces repetitive phrasing
  })
  const latencyMs = Date.now() - start
  const text = completion.choices[0]?.message?.content?.trim() || ''
  if (!text) {
    throw new Error('OpenAI returned empty response')
  }
  const usage = (completion as any).usage || {}
  return {
    text,
    provider: 'openai',
    model,
    latencyMs,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens
  }
}

async function callGemini(question: string, context: CoachingContext, model: string): Promise<LLMResult> {
  const cfg = getAIServiceConfig()
  const apiKey = cfg.gemini.apiKey
  if (!cfg.gemini.enabled || !apiKey) {
    throw new Error('Gemini not configured')
  }
  const client = new GoogleGenerativeAI(apiKey)
  const genModel = client.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.8, // ⚡ INCREASED from 0.7 for more creative responses
      topP: 0.95, // ⚡ INCREASED from 0.9 for more diverse vocabulary
      maxOutputTokens: 2000, // ⚡ DOUBLED from 1000 for detailed responses
    }
  })
  const prompt = generateCoachingPrompt(question, context)
  const start = Date.now()
  const result = await genModel.generateContent(prompt)
  const latencyMs = Date.now() - start
  const response = await result.response
  const text = response.text().trim()
  if (!text) {
    throw new Error('Gemini returned empty response')
  }
  return { text, provider: 'gemini', model, latencyMs }
}

export async function generateWithRedundancy(question: string, context: CoachingContext): Promise<LLMResult> {
  const { openaiModel, geminiModel, timeoutMs, primary } = getModelsFromEnv()

  // Check if any AI services are configured
  const cfg = getAIServiceConfig()
  const hasAnyAI = cfg.gemini.enabled || cfg.openai.enabled

  if (!hasAnyAI) {
    // Return a fallback response when no AI services are configured
    console.warn('No AI services configured, using fallback content generation')
    throw new Error('No AI services configured. Using fallback content generation.')
  }

  const primaryFn = primary === 'gemini' && cfg.gemini.enabled
    ? () => callGemini(question, context, geminiModel)
    : cfg.openai.enabled
    ? () => callOpenAI(question, context, openaiModel)
    : null

  const fallbackFn = primary === 'gemini' && cfg.openai.enabled
    ? () => callOpenAI(question, context, openaiModel)
    : cfg.gemini.enabled
    ? () => callGemini(question, context, geminiModel)
    : null

  if (!primaryFn) {
    throw new Error(`Primary provider ${primary} not configured. Check environment variables.`)
  }

  try {
    return await withTimeout(primaryFn(), timeoutMs, `${primary} call`)
  } catch (err) {
    console.warn(`Primary provider ${primary} failed, attempting fallback`, err)

    if (!fallbackFn) {
      throw new Error(`Both primary (${primary}) and fallback providers failed or not configured`)
    }

    return await withTimeout(fallbackFn(), timeoutMs, `fallback call`)
  }
}


