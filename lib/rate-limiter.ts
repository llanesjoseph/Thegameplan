// Enterprise-grade rate limiting for AI services and API endpoints
import { RateLimitConfig } from '../types'

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

// In-memory store for development/single-instance deployments
// In production, you'd want to use Redis or a distributed cache
class MemoryStore {
  private store = new Map<string, RateLimitEntry>()
  
  async get(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key) || null
  }
  
  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry)
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
  
  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class RateLimiter {
  private store: MemoryStore
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.store = new MemoryStore()
    
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.store.cleanup()
    }, 60000)
  }
  
  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier for the rate limit (usually user ID)
   * @param config - Rate limit configuration
   * @returns Promise<RateLimitResult>
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    let entry = await this.store.get(key)
    
    // If no entry exists or window has expired, create new entry
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      }
      await this.store.set(key, entry)
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime
      }
    }
    
    // Check if we're still within the current window
    if (entry.firstRequest >= windowStart) {
      if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: entry.resetTime - now
        }
      }
      
      // Increment count and update entry
      entry.count += 1
      await this.store.set(key, entry)
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
      }
    }
    
    // Window has expired, reset
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    }
    await this.store.set(key, entry)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    }
  }
  
  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.store.delete(key)
  }
  
  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = await this.store.get(key)
    
    if (!entry || entry.resetTime < now) {
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs
      }
    }
    
    const remaining = Math.max(0, config.maxRequests - entry.count)
    
    return {
      success: remaining > 0,
      limit: config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: remaining === 0 ? entry.resetTime - now : undefined
    }
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Predefined rate limit configurations for different services
export const RATE_LIMITS = {
  // AI Service limits
  AI_REQUESTS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute per user
    keyGenerator: (userId: string) => `ai_requests:${userId}`
  },
  
  AI_REQUESTS_PREMIUM: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute for premium users
    keyGenerator: (userId: string) => `ai_requests_premium:${userId}`
  },
  
  AI_REQUESTS_HOURLY: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 requests per hour per user
    keyGenerator: (userId: string) => `ai_requests_hourly:${userId}`
  },
  
  AI_REQUESTS_DAILY: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 500, // 500 requests per day per user
    keyGenerator: (userId: string) => `ai_requests_daily:${userId}`
  },
  
  // API endpoint limits
  AUTH_REQUESTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 auth attempts per 15 minutes
    keyGenerator: (ip: string) => `auth_requests:${ip}`
  },
  
  PROFILE_UPDATES: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 profile updates per minute
    keyGenerator: (userId: string) => `profile_updates:${userId}`
  },
  
  FILE_UPLOADS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 file uploads per minute
    keyGenerator: (userId: string) => `file_uploads:${userId}`
  },
  
  // Creator-specific limits
  CONTENT_CREATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 content items per hour
    keyGenerator: (creatorId: string) => `content_creation:${creatorId}`
  }
} as const

/**
 * Check rate limit for AI requests based on user subscription
 */
export async function checkAIRateLimit(
  userId: string, 
  subscriptionTier: 'free' | 'basic' | 'pro' | 'elite'
): Promise<RateLimitResult> {
  // Choose appropriate rate limit based on subscription
  const config = subscriptionTier === 'free' || subscriptionTier === 'basic' 
    ? RATE_LIMITS.AI_REQUESTS 
    : RATE_LIMITS.AI_REQUESTS_PREMIUM
  
  const key = config.keyGenerator(userId)
  return rateLimiter.checkLimit(key, config)
}

/**
 * Check daily AI usage limits
 */
export async function checkDailyAILimit(userId: string): Promise<RateLimitResult> {
  const config = RATE_LIMITS.AI_REQUESTS_DAILY
  const key = config.keyGenerator(userId)
  return rateLimiter.checkLimit(key, config)
}

/**
 * Generic rate limit checker
 */
export async function checkRateLimit(
  key: string, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimiter.checkLimit(key, config)
}

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitConfig, keyGenerator?: (req: unknown) => string) {
  return async (req: unknown, res: unknown, next: unknown) => {
    try {
      // Type assertion for request/response objects
      const request = req as { ip?: string; user?: { id: string }; headers?: { [key: string]: string } }
      const response = res as { 
        status: (code: number) => { json: (data: unknown) => void }
        setHeader: (name: string, value: string | number) => void
      }
      const nextFn = next as () => void
      
      const key = keyGenerator ? keyGenerator(req) : 
        config.keyGenerator ? config.keyGenerator(request.user?.id || request.ip || 'anonymous') :
        request.user?.id || request.ip || 'anonymous'
      
      const result = await rateLimiter.checkLimit(key, config)
      
      // Set rate limit headers
      response.setHeader('X-RateLimit-Limit', result.limit)
      response.setHeader('X-RateLimit-Remaining', result.remaining)
      response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000))
      
      if (!result.success) {
        response.setHeader('Retry-After', Math.ceil((result.retryAfter || 0) / 1000))
        response.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        })
        return
      }
      
      nextFn()
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Don't block request if rate limiting fails
      const nextFn = next as () => void
      nextFn()
    }
  }
}

/**
 * Next.js API route wrapper for rate limiting
 */
export function withRateLimit<T>(
  handler: T,
  config: RateLimitConfig,
  keyGenerator?: (req: unknown) => string
) {
  return async (req: unknown, res: unknown) => {
    const middleware = createRateLimitMiddleware(config, keyGenerator)
    
    return new Promise<void>((resolve, reject) => {
      middleware(req, res, (err?: unknown) => {
        if (err) {
          reject(err)
          return
        }
        
        // Check if response was already sent (rate limited)
        const response = res as { headersSent?: boolean }
        if (response.headersSent) {
          resolve()
          return
        }
        
        // Call original handler
        try {
          const result = (handler as (req: unknown, res: unknown) => Promise<void> | void)(req, res)
          if (result && typeof result.then === 'function') {
            result.then(resolve).catch(reject)
          } else {
            resolve()
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }
}

// Export singleton instance
export default rateLimiter

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    rateLimiter.destroy()
  })
  process.on('SIGINT', () => {
    rateLimiter.destroy()
  })
}