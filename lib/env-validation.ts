// Environment variable validation and configuration
import { z } from 'zod'

// Server-side schema (full validation)
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(), // Server-side only (secure)
  NEXT_PUBLIC_VERTEX_API_KEY: z.string().optional(),
  NEXT_PUBLIC_VERTEX_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_VERTEX_LOCATION: z.string().default('us-central1'),
  OPENAI_API_KEY: z.string().optional(),
  AI_PRIMARY_PROVIDER: z.enum(['gemini', 'openai']).optional(),
  AI_TIMEOUT_MS: z.string().optional(),
  AI_OPENAI_MODEL: z.string().optional(),
  AI_GEMINI_MODEL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

// Client-side schema (only NEXT_PUBLIC_ variables)
const clientEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GEMINI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_VERTEX_API_KEY: z.string().optional(),
  NEXT_PUBLIC_VERTEX_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_VERTEX_LOCATION: z.string().default('us-central1'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  STRIPE_PUBLIC_KEY: z.string().optional(),
})

const envSchema = typeof window === 'undefined' ? serverEnvSchema : clientEnvSchema

export type Env = z.infer<typeof serverEnvSchema>

let cachedEnv: Env | null = null

export function validateEnv(): Env {
  if (cachedEnv) {
    return cachedEnv
  }

  const isServer = typeof window === 'undefined'

  try {
    // Use different parsing strategies for client vs server
    let env: any
    
    if (isServer) {
      // Server-side: full validation
      env = serverEnvSchema.parse(process.env)
      
      const hasAIService = !!(
        env.NEXT_PUBLIC_GEMINI_API_KEY ||
        env.GEMINI_API_KEY ||
        env.NEXT_PUBLIC_VERTEX_API_KEY ||
        env.OPENAI_API_KEY
      )

      if (!hasAIService) {
        console.warn('⚠️ No AI service API keys configured. AI features will use fallback content generation.')
      }

      console.log('✅ Environment validation successful')
      console.log(`🔥 Firebase Project: ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`)
      console.log(`🤖 AI Services: ${[
        (env.NEXT_PUBLIC_GEMINI_API_KEY || env.GEMINI_API_KEY) && 'Gemini',
        env.NEXT_PUBLIC_VERTEX_API_KEY && 'Vertex',
        env.OPENAI_API_KEY && 'OpenAI'
      ].filter(Boolean).join(', ')}`)
    } else {
      // Client-side: only validate what's available and provide defaults for missing server-only vars
      const clientEnv = {
        NODE_ENV: process.env.NODE_ENV || 'development',
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        NEXT_PUBLIC_VERTEX_API_KEY: process.env.NEXT_PUBLIC_VERTEX_API_KEY,
        NEXT_PUBLIC_VERTEX_PROJECT_ID: process.env.NEXT_PUBLIC_VERTEX_PROJECT_ID,
        NEXT_PUBLIC_VERTEX_LOCATION: process.env.NEXT_PUBLIC_VERTEX_LOCATION || 'us-central1',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
        // Add server-only defaults for client type compatibility
        OPENAI_API_KEY: undefined,
        STRIPE_SECRET_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: undefined,
      }
      
      env = clientEnvSchema.parse(clientEnv)
      
      // Check if Firebase config is available
      if (!env.NEXT_PUBLIC_FIREBASE_API_KEY || !env.NEXT_PUBLIC_FIREBASE_APP_ID) {
        console.warn('⚠️ Firebase configuration missing on client side. Authentication may not work properly.')
      }
      
      // Check client AI services
      const hasClientAIService = !!(
        env.NEXT_PUBLIC_GEMINI_API_KEY || 
        env.NEXT_PUBLIC_VERTEX_API_KEY
      )
      
      if (!hasClientAIService) {
        console.warn('⚠️ No client-side AI services configured. Some features may not work.')
      }
    }
    
    cachedEnv = env as Env
    return cachedEnv
  } catch (error) {
    // Only show errors on server side to avoid client console spam
    if (isServer) {
      console.error('❌ Environment validation failed:')
      
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`)
        })
      } else {
        console.error(`  - ${error}`)
      }
      
      console.error('\n💡 Please check your .env.local file and ensure all required environment variables are set.')
      console.error('📖 See .env.local.example for the complete list of required variables.')
    }
    
    throw new Error('Environment validation failed. Check console for details.')
  }
}

// Helper functions for specific configurations
export function getFirebaseConfig() {
  const env = validateEnv()
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ...(env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && {
      measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    })
  }
}

export function getAIServiceConfig() {
  const env = validateEnv()
  const isServer = typeof window === 'undefined'

  // Prefer server-side GEMINI_API_KEY (secure) over NEXT_PUBLIC (exposed to client)
  const geminiApiKey = isServer && (env as any).GEMINI_API_KEY
    ? (env as any).GEMINI_API_KEY
    : env.NEXT_PUBLIC_GEMINI_API_KEY

  return {
    gemini: {
      apiKey: geminiApiKey,
      enabled: !!geminiApiKey
    },
    vertex: {
      apiKey: env.NEXT_PUBLIC_VERTEX_API_KEY,
      projectId: env.NEXT_PUBLIC_VERTEX_PROJECT_ID,
      location: env.NEXT_PUBLIC_VERTEX_LOCATION,
      enabled: !!(env.NEXT_PUBLIC_VERTEX_API_KEY && env.NEXT_PUBLIC_VERTEX_PROJECT_ID)
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
      enabled: !!env.OPENAI_API_KEY
    }
  }
}

export function getLLMOrchestrationConfig() {
  const env = validateEnv() as any
  return {
    primaryProvider: (env.AI_PRIMARY_PROVIDER as 'gemini' | 'openai' | undefined) || 'gemini',
    timeoutMs: Number(env.AI_TIMEOUT_MS || 10000),
    openaiModel: env.AI_OPENAI_MODEL || 'gpt-4-turbo-preview',
    geminiModel: env.AI_GEMINI_MODEL || 'gemini-2.5-flash',
  }
}

export function getStripeConfig() {
  const env = validateEnv()
  return {
    publicKey: env.STRIPE_PUBLIC_KEY,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    enabled: !!(env.STRIPE_PUBLIC_KEY && env.STRIPE_SECRET_KEY)
  }
}

// Skip validation during Next.js build phase (Vercel deployment)
// Environment variables are only available at runtime, not during build
// Validation will happen at runtime when the functions are actually called
//
// Note: We don't validate on module import to prevent build failures.
// Each helper function (getFirebaseConfig, etc.) calls validateEnv() which
// will validate when actually needed at runtime.