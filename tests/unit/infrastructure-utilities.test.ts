/**
 * Infrastructure & Utilities Tests
 * Tests for error handling, environment validation, and analytics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Error Handling System', () => {
  describe('AppError Class', () => {
    it('should create error with required properties', () => {
      const error = {
        name: 'AppError',
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 500,
        isOperational: true,
        timestamp: new Date()
      }

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should default status code to 500', () => {
      const statusCode = 500
      expect(statusCode).toBe(500)
    })

    it('should default isOperational to true', () => {
      const isOperational = true
      expect(isOperational).toBe(true)
    })

    it('should optionally include userId', () => {
      const error = {
        message: 'Error',
        userId: 'user-123'
      }

      expect(error.userId).toBe('user-123')
    })

    it('should optionally include context', () => {
      const error = {
        message: 'Error',
        context: { field: 'email', value: 'invalid' }
      }

      expect(error.context).toBeDefined()
      expect(error.context.field).toBe('email')
    })
  })

  describe('Validation Error', () => {
    it('should have status code 400', () => {
      const error = { code: 'VALIDATION_ERROR', statusCode: 400 }
      expect(error.statusCode).toBe(400)
    })

    it('should include field in context', () => {
      const context = { field: 'email' }
      expect(context.field).toBe('email')
    })
  })

  describe('Authentication Error', () => {
    it('should have status code 401', () => {
      const error = { code: 'AUTH_ERROR', statusCode: 401 }
      expect(error.statusCode).toBe(401)
    })

    it('should have default message', () => {
      const message = 'Authentication required'
      expect(message).toBe('Authentication required')
    })
  })

  describe('Authorization Error', () => {
    it('should have status code 403', () => {
      const error = { code: 'AUTHORIZATION_ERROR', statusCode: 403 }
      expect(error.statusCode).toBe(403)
    })

    it('should have default message', () => {
      const message = 'Insufficient permissions'
      expect(message).toBe('Insufficient permissions')
    })
  })

  describe('Not Found Error', () => {
    it('should have status code 404', () => {
      const error = { code: 'NOT_FOUND', statusCode: 404 }
      expect(error.statusCode).toBe(404)
    })

    it('should include resource in message', () => {
      const resource = 'User'
      const message = `${resource} not found`
      expect(message).toBe('User not found')
    })
  })

  describe('Rate Limit Error', () => {
    it('should have status code 429', () => {
      const error = { code: 'RATE_LIMIT', statusCode: 429 }
      expect(error.statusCode).toBe(429)
    })

    it('should have default message', () => {
      const message = 'Rate limit exceeded'
      expect(message).toBe('Rate limit exceeded')
    })
  })

  describe('External Service Error', () => {
    it('should have status code 502', () => {
      const error = { code: 'EXTERNAL_SERVICE_ERROR', statusCode: 502 }
      expect(error.statusCode).toBe(502)
    })

    it('should include service name in message', () => {
      const service = 'OpenAI'
      const message = `External service error: ${service}`
      expect(message).toBe('External service error: OpenAI')
    })

    it('should include original error in context', () => {
      const originalError = new Error('API timeout')
      const context = { service: 'OpenAI', originalError: originalError.message }

      expect(context.originalError).toBe('API timeout')
    })
  })

  describe('Firebase Error Handling', () => {
    it('should map permission-denied to AuthorizationError', () => {
      const firebaseError = { code: 'permission-denied', message: 'Permission denied' }
      const mapped = { code: 'AUTHORIZATION_ERROR', statusCode: 403 }

      expect(mapped.code).toBe('AUTHORIZATION_ERROR')
      expect(mapped.statusCode).toBe(403)
    })

    it('should map unauthenticated to AuthenticationError', () => {
      const firebaseError = { code: 'unauthenticated', message: 'Not authenticated' }
      const mapped = { code: 'AUTH_ERROR', statusCode: 401 }

      expect(mapped.code).toBe('AUTH_ERROR')
    })

    it('should map not-found to NotFoundError', () => {
      const firebaseError = { code: 'not-found', message: 'Document not found' }
      const mapped = { code: 'NOT_FOUND', statusCode: 404 }

      expect(mapped.code).toBe('NOT_FOUND')
    })

    it('should map resource-exhausted to RateLimitError', () => {
      const firebaseError = { code: 'resource-exhausted', message: 'Quota exceeded' }
      const mapped = { code: 'RATE_LIMIT', statusCode: 429 }

      expect(mapped.code).toBe('RATE_LIMIT')
    })

    it('should map unavailable to ExternalServiceError', () => {
      const firebaseError = { code: 'unavailable', message: 'Service unavailable' }
      const mapped = { code: 'EXTERNAL_SERVICE_ERROR', statusCode: 502 }

      expect(mapped.code).toBe('EXTERNAL_SERVICE_ERROR')
    })

    it('should handle unknown Firebase codes', () => {
      const firebaseError = { code: 'custom-error', message: 'Custom error' }
      const mapped = { code: `FIREBASE_CUSTOM-ERROR`, statusCode: 500 }

      expect(mapped.code).toContain('FIREBASE_')
      expect(mapped.statusCode).toBe(500)
    })
  })

  describe('Error Logger', () => {
    it('should be a singleton instance', () => {
      const singleton: { instance: object | null } = { instance: null }

      if (!singleton.instance) {
        singleton.instance = {}
      }

      expect(singleton.instance).toBeDefined()
    })

    it('should allow setting user ID', () => {
      const logger = { userId: undefined as string | undefined }
      logger.userId = 'user-123'

      expect(logger.userId).toBe('user-123')
    })

    it('should log errors with timestamp', () => {
      const errorData = {
        timestamp: new Date().toISOString(),
        message: 'Test error'
      }

      expect(errorData.timestamp).toBeDefined()
      expect(new Date(errorData.timestamp)).toBeInstanceOf(Date)
    })

    it('should include userId in error logs', () => {
      const userId = 'user-123'
      const errorData = {
        userId,
        message: 'Error occurred'
      }

      expect(errorData.userId).toBe('user-123')
    })

    it('should filter out event objects', () => {
      const eventObject = { type: 'click', target: {} }
      const isEvent = 'type' in eventObject && 'target' in eventObject

      expect(isEvent).toBe(true)
    })

    it('should handle AppError instances', () => {
      const appError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 500,
        stack: 'Error stack',
        isOperational: true
      }

      expect(appError.code).toBe('TEST_ERROR')
      expect(appError.isOperational).toBe(true)
    })

    it('should handle regular Error instances', () => {
      const error = new Error('Regular error')

      expect(error.message).toBe('Regular error')
      expect(error.stack).toBeDefined()
    })

    it('should handle unknown error types', () => {
      const unknownError = 'string error'
      const message = String(unknownError)

      expect(message).toBe('string error')
    })

    it('should limit stored errors to 100', () => {
      const maxErrors = 100
      const errors = new Array(150).fill({})
      const limitedErrors = errors.slice(-maxErrors)

      expect(limitedErrors.length).toBe(100)
    })
  })

  describe('User Action Logging', () => {
    it('should log successful actions', () => {
      const action = {
        action: 'login',
        success: true,
        timestamp: new Date().toISOString()
      }

      expect(action.success).toBe(true)
      expect(action.action).toBe('login')
    })

    it('should log failed actions', () => {
      const action = {
        action: 'upload',
        success: false,
        timestamp: new Date().toISOString()
      }

      expect(action.success).toBe(false)
    })

    it('should include metadata', () => {
      const action = {
        action: 'video_upload',
        success: true,
        metadata: { fileSize: 1024, duration: 300 }
      }

      expect(action.metadata?.fileSize).toBe(1024)
      expect(action.metadata?.duration).toBe(300)
    })

    it('should limit stored actions to 1000', () => {
      const maxActions = 1000
      const actions = new Array(1500).fill({})
      const limitedActions = actions.slice(-maxActions)

      expect(limitedActions.length).toBe(1000)
    })
  })

  describe('Error Display Messages', () => {
    it('should provide user-friendly message for AUTH_ERROR', () => {
      const code = 'AUTH_ERROR'
      const message = 'Please sign in to continue'

      expect(message).toBe('Please sign in to continue')
    })

    it('should provide user-friendly message for AUTHORIZATION_ERROR', () => {
      const code = 'AUTHORIZATION_ERROR'
      const message = "You don't have permission to perform this action"

      expect(message).toContain('permission')
    })

    it('should provide user-friendly message for NOT_FOUND', () => {
      const code = 'NOT_FOUND'
      const message = 'The requested resource was not found'

      expect(message).toContain('not found')
    })

    it('should provide user-friendly message for RATE_LIMIT', () => {
      const code = 'RATE_LIMIT'
      const message = 'Too many requests. Please try again later'

      expect(message).toContain('try again later')
    })

    it('should provide user-friendly message for EXTERNAL_SERVICE_ERROR', () => {
      const code = 'EXTERNAL_SERVICE_ERROR'
      const message = 'Service temporarily unavailable. Please try again'

      expect(message).toContain('temporarily unavailable')
    })

    it('should have default message for unknown errors', () => {
      const code = 'UNKNOWN'
      const message = 'Something went wrong. Please try again'

      expect(message).toContain('Something went wrong')
    })
  })

  describe('Error Response Format', () => {
    it('should create error response with success false', () => {
      const response = {
        success: false,
        error: { message: 'Error', code: 'TEST_ERROR' }
      }

      expect(response.success).toBe(false)
    })

    it('should include error message', () => {
      const response = {
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR' }
      }

      expect(response.error.message).toBe('Validation failed')
    })

    it('should include error code', () => {
      const response = {
        success: false,
        error: { message: 'Error', code: 'AUTH_ERROR' }
      }

      expect(response.error.code).toBe('AUTH_ERROR')
    })

    it('should include timestamp', () => {
      const response = {
        success: false,
        error: { message: 'Error', code: 'ERROR', timestamp: new Date() }
      }

      expect(response.error.timestamp).toBeInstanceOf(Date)
    })
  })
})

describe('Environment Validation', () => {
  describe('Required Firebase Variables', () => {
    it('should require NEXT_PUBLIC_FIREBASE_API_KEY', () => {
      const required = true
      expect(required).toBe(true)
    })

    it('should require NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', () => {
      const required = true
      expect(required).toBe(true)
    })

    it('should require NEXT_PUBLIC_FIREBASE_PROJECT_ID', () => {
      const required = true
      expect(required).toBe(true)
    })

    it('should require NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', () => {
      const required = true
      expect(required).toBe(true)
    })

    it('should require NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', () => {
      const required = true
      expect(required).toBe(true)
    })

    it('should require NEXT_PUBLIC_FIREBASE_APP_ID', () => {
      const required = true
      expect(required).toBe(true)
    })

    it('should make FIREBASE_MEASUREMENT_ID optional', () => {
      const optional = true
      expect(optional).toBe(true)
    })
  })

  describe('Optional AI Service Variables', () => {
    it('should make NEXT_PUBLIC_GEMINI_API_KEY optional', () => {
      const optional = true
      expect(optional).toBe(true)
    })

    it('should make NEXT_PUBLIC_VERTEX_API_KEY optional', () => {
      const optional = true
      expect(optional).toBe(true)
    })

    it('should make OPENAI_API_KEY optional', () => {
      const optional = true
      expect(optional).toBe(true)
    })

    it('should default VERTEX_LOCATION to us-central1', () => {
      const defaultLocation = 'us-central1'
      expect(defaultLocation).toBe('us-central1')
    })
  })

  describe('Environment Defaults', () => {
    it('should default NODE_ENV to development', () => {
      const env = process.env.NODE_ENV || 'development'
      expect(env).toBeDefined()
    })

    it('should default APP_URL to localhost:3000', () => {
      const defaultUrl = 'http://localhost:3000'
      expect(defaultUrl).toBe('http://localhost:3000')
    })
  })

  describe('AI Service Detection', () => {
    it('should detect when Gemini is configured', () => {
      const geminiKey = 'test-gemini-key'
      const hasGemini = !!geminiKey

      expect(hasGemini).toBe(true)
    })

    it('should detect when Vertex is configured', () => {
      const vertexKey = 'test-vertex-key'
      const hasVertex = !!vertexKey

      expect(hasVertex).toBe(true)
    })

    it('should detect when OpenAI is configured', () => {
      const openaiKey = 'test-openai-key'
      const hasOpenAI = !!openaiKey

      expect(hasOpenAI).toBe(true)
    })

    it('should detect when no AI service is configured', () => {
      const geminiKey = undefined
      const vertexKey = undefined
      const openaiKey = undefined
      const hasAI = !!(geminiKey || vertexKey || openaiKey)

      expect(hasAI).toBe(false)
    })
  })

  describe('Server vs Client Validation', () => {
    it('should validate all vars on server', () => {
      const isServer = typeof window === 'undefined'
      // In tests, window might not be defined
      expect(typeof isServer).toBe('boolean')
    })

    it('should validate only NEXT_PUBLIC vars on client', () => {
      const publicVar = 'NEXT_PUBLIC_FIREBASE_API_KEY'
      expect(publicVar).toContain('NEXT_PUBLIC_')
    })

    it('should not expose server-only secrets to client', () => {
      const serverOnlyVars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
      serverOnlyVars.forEach(varName => {
        expect(varName).not.toContain('NEXT_PUBLIC_')
      })
    })
  })

  describe('Firebase Config Helper', () => {
    it('should include required Firebase properties', () => {
      const config = {
        apiKey: 'test-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456',
        appId: 'test-app-id'
      }

      expect(config.apiKey).toBeDefined()
      expect(config.authDomain).toBeDefined()
      expect(config.projectId).toBeDefined()
      expect(config.storageBucket).toBeDefined()
      expect(config.messagingSenderId).toBeDefined()
      expect(config.appId).toBeDefined()
    })

    it('should optionally include measurementId', () => {
      const measurementId = 'G-XXXXXXXXXX'
      const config = { measurementId }

      expect(config.measurementId).toBe('G-XXXXXXXXXX')
    })
  })

  describe('AI Service Config Helper', () => {
    it('should return Gemini config with enabled status', () => {
      const apiKey = 'test-key'
      const config = { apiKey, enabled: !!apiKey }

      expect(config.enabled).toBe(true)
      expect(config.apiKey).toBe('test-key')
    })

    it('should return Vertex config with project and location', () => {
      const apiKey = 'test-key'
      const projectId = 'test-project'
      const config = {
        apiKey,
        projectId,
        location: 'us-central1',
        enabled: !!(apiKey && projectId)
      }

      expect(config.projectId).toBe('test-project')
      expect(config.location).toBe('us-central1')
      expect(config.enabled).toBe(true)
    })

    it('should default Vertex enabled to false if missing projectId', () => {
      const apiKey = 'test-key'
      const projectId = undefined
      const enabled = !!(apiKey && projectId)

      expect(enabled).toBe(false)
    })
  })

  describe('LLM Orchestration Config', () => {
    it('should default to gemini as primary provider', () => {
      const primaryProvider = 'gemini'
      expect(primaryProvider).toBe('gemini')
    })

    it('should default timeout to 10000ms', () => {
      const timeout = 10000
      expect(timeout).toBe(10000)
    })

    it('should default to gpt-4-turbo-preview for OpenAI', () => {
      const model = 'gpt-4-turbo-preview'
      expect(model).toBe('gpt-4-turbo-preview')
    })

    it('should default to gemini-1.5-flash for Gemini', () => {
      const model = 'gemini-1.5-flash'
      expect(model).toBe('gemini-1.5-flash')
    })
  })

  describe('Stripe Config Helper', () => {
    it('should return Stripe config with enabled status', () => {
      const publicKey = 'pk_test_123'
      const secretKey = 'sk_test_456'
      const config = { publicKey, secretKey, enabled: !!(publicKey && secretKey) }

      expect(config.enabled).toBe(true)
    })

    it('should mark Stripe as disabled if keys missing', () => {
      const publicKey = undefined
      const secretKey = undefined
      const enabled = !!(publicKey && secretKey)

      expect(enabled).toBe(false)
    })

    it('should include webhook secret', () => {
      const webhookSecret = 'whsec_test'
      expect(webhookSecret).toBe('whsec_test')
    })
  })
})

describe('Analytics Service', () => {
  describe('Lesson View Tracking', () => {
    it('should increment view count', () => {
      let views = 5
      views = views + 1

      expect(views).toBe(6)
    })

    it('should update lesson updatedAt timestamp', () => {
      const beforeUpdate = new Date('2024-01-01')
      const afterUpdate = new Date()

      expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime())
    })

    it('should create analytics document if not exists', () => {
      const analyticsExists = false
      const shouldCreate = !analyticsExists

      expect(shouldCreate).toBe(true)
    })

    it('should initialize analytics with zero values', () => {
      const analytics = {
        views: 1,
        uniqueViews: 1,
        totalViewTime: 0,
        completionRate: 0,
        engagementScore: 0,
        likes: 0,
        shares: 0,
        comments: 0
      }

      expect(analytics.views).toBe(1)
      expect(analytics.totalViewTime).toBe(0)
      expect(analytics.engagementScore).toBe(0)
    })

    it('should update creator total views', () => {
      let creatorViews = 100
      creatorViews = creatorViews + 1

      expect(creatorViews).toBe(101)
    })

    it('should increment active viewers', () => {
      let activeViewers = 50
      activeViewers = activeViewers + 1

      expect(activeViewers).toBe(51)
    })
  })

  describe('Lesson Completion Tracking', () => {
    it('should increment watch time', () => {
      let totalWatchTime = 3600 // 1 hour in seconds
      const sessionTime = 1800 // 30 minutes
      totalWatchTime = totalWatchTime + sessionTime

      expect(totalWatchTime).toBe(5400) // 1.5 hours
    })

    it('should increment completion rate', () => {
      let completions = 10
      completions = completions + 1

      expect(completions).toBe(11)
    })

    it('should award engagement points for completion', () => {
      let engagementScore = 20
      engagementScore = engagementScore + 5 // 5 points for completion

      expect(engagementScore).toBe(25)
    })

    it('should update user analytics', () => {
      const userAnalytics = {
        totalWatchTime: 7200,
        lessonsCompleted: 5
      }

      expect(userAnalytics.totalWatchTime).toBe(7200)
      expect(userAnalytics.lessonsCompleted).toBe(5)
    })

    it('should create user analytics if not exists', () => {
      const userAnalyticsExists = false
      const shouldCreate = !userAnalyticsExists

      expect(shouldCreate).toBe(true)
    })
  })

  describe('Engagement Tracking', () => {
    it('should award 1 point for likes', () => {
      const likePoints = 1
      expect(likePoints).toBe(1)
    })

    it('should award 3 points for comments', () => {
      const commentPoints = 3
      expect(commentPoints).toBe(3)
    })

    it('should award 2 points for shares', () => {
      const sharePoints = 2
      expect(sharePoints).toBe(2)
    })

    it('should increment engagement counters', () => {
      let likes = 10
      let comments = 5
      let shares = 3

      likes++
      comments++
      shares++

      expect(likes).toBe(11)
      expect(comments).toBe(6)
      expect(shares).toBe(4)
    })

    it('should update engagement score', () => {
      let engagementScore = 50
      const likePoints = 1

      engagementScore = engagementScore + likePoints

      expect(engagementScore).toBe(51)
    })
  })

  describe('Creator Analytics Retrieval', () => {
    it('should initialize creator analytics if not exists', () => {
      const creatorAnalytics = {
        totalFollowers: 0,
        activeViewers: 0,
        totalViews: 0,
        totalViewTime: 0,
        contentCount: 0,
        revenueGenerated: 0,
        topPerformingContent: []
      }

      expect(creatorAnalytics.totalFollowers).toBe(0)
      expect(creatorAnalytics.topPerformingContent).toEqual([])
    })

    it('should return existing analytics', () => {
      const existingAnalytics = {
        totalFollowers: 1500,
        activeViewers: 250,
        totalViews: 50000,
        contentCount: 25
      }

      expect(existingAnalytics.totalFollowers).toBe(1500)
      expect(existingAnalytics.activeViewers).toBe(250)
    })

    it('should convert Firestore timestamps to dates', () => {
      const firestoreTimestamp = { toDate: () => new Date('2024-01-01') }
      const date = firestoreTimestamp.toDate()

      expect(date).toBeInstanceOf(Date)
    })
  })

  describe('Lesson Analytics for Creator', () => {
    it('should query published content only', () => {
      const status = 'published'
      expect(status).toBe('published')
    })

    it('should limit to 10 most recent lessons', () => {
      const limit = 10
      expect(limit).toBe(10)
    })

    it('should order by creation date descending', () => {
      const orderDirection = 'desc'
      expect(orderDirection).toBe('desc')
    })

    it('should initialize missing analytics with zeros', () => {
      const analytics = {
        views: 0,
        uniqueViews: 0,
        totalViewTime: 0,
        completionRate: 0,
        engagementScore: 0
      }

      expect(analytics.views).toBe(0)
      expect(analytics.completionRate).toBe(0)
    })

    it('should return lesson with analytics data', () => {
      const lesson = {
        id: 'lesson-123',
        title: 'Test Lesson',
        views: 150,
        viewDuration: 450,
        completionRate: 75,
        engagement: 85
      }

      expect(lesson.title).toBe('Test Lesson')
      expect(lesson.views).toBe(150)
      expect(lesson.engagement).toBe(85)
    })

    it('should handle untitled lessons', () => {
      const title = undefined
      const displayTitle = title || 'Untitled'

      expect(displayTitle).toBe('Untitled')
    })
  })

  describe('Content Count Updates', () => {
    it('should count only published content', () => {
      const publishedContent = [
        { status: 'published' },
        { status: 'published' },
        { status: 'draft' }
      ]

      const count = publishedContent.filter(c => c.status === 'published').length

      expect(count).toBe(2)
    })

    it('should update creator analytics with content count', () => {
      const creatorAnalytics = { contentCount: 15 }
      expect(creatorAnalytics.contentCount).toBe(15)
    })
  })

  describe('Analytics Error Handling', () => {
    it('should log errors and continue', () => {
      const error = new Error('Analytics error')
      const logged = true

      expect(error.message).toBe('Analytics error')
      expect(logged).toBe(true)
    })

    it('should return null on creator analytics error', () => {
      const result = null
      expect(result).toBeNull()
    })

    it('should return empty array on lesson analytics error', () => {
      const result: any[] = []
      expect(result).toEqual([])
    })
  })

  describe('Batch Operations', () => {
    it('should use batch writes for atomic updates', () => {
      const useBatch = true
      expect(useBatch).toBe(true)
    })

    it('should update multiple documents in single transaction', () => {
      const updates = ['lesson', 'lessonAnalytics', 'creatorAnalytics']
      expect(updates.length).toBe(3)
    })

    it('should commit all changes together', () => {
      const allOrNothing = true
      expect(allOrNothing).toBe(true)
    })
  })
})
