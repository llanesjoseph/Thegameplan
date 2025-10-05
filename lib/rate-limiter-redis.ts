/**
 * Production-Ready Rate Limiter with Redis
 * Falls back to in-memory for development
 */

import Redis from 'ioredis'

// Redis client (singleton)
let redis: Redis | null = null

if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    })
  } catch (error) {
    console.error('Redis connection failed, falling back to in-memory:', error)
  }
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()

  // Use Redis in production
  if (redis) {
    try {
      const count = await redis.incr(key)
      
      // Set expiry on first request
      if (count === 1) {
        await redis.pexpire(key, windowMs)
      }

      const ttl = await redis.pttl(key)
      const resetTime = now + (ttl > 0 ? ttl : windowMs)

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fall through to in-memory on Redis error
    }
  }

  // In-memory fallback
  const current = memoryStore.get(key)

  if (!current || now > current.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }

  current.count++

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime
  }
}

// Cleanup in-memory store periodically
if (!redis && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.entries()) {
      if (now > value.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}
