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
  const start = Date.now()
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: `You are ${context.coachName}, an elite ${context.sport.toLowerCase()} coach and former player. Respond authentically in character with encouraging, technical advice.` },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 0.9
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
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1000,
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


