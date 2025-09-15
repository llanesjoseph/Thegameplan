// Enterprise-grade error handling system
import { FirebaseError } from 'firebase/app'

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: Date
  public readonly userId?: string
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    code: string = 'GENERIC_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    userId?: string,
    context?: Record<string, unknown>
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date()
    this.userId = userId
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, userId?: string) {
    super(message, 'VALIDATION_ERROR', 400, true, userId, { field })
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', userId?: string) {
    super(message, 'AUTH_ERROR', 401, true, userId)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', userId?: string) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, userId)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, userId?: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, true, userId)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', userId?: string) {
    super(message, 'RATE_LIMIT', 429, true, userId)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error, userId?: string) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502, true, userId, {
      service,
      originalError: originalError?.message
    })
  }
}

// Error handler for Firebase operations
export function handleFirebaseError(error: unknown, userId?: string): AppError {
  if (error instanceof FirebaseError || (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string')) {
    const firebaseError = error as { code: string; message: string }
    switch (firebaseError.code) {
      case 'permission-denied':
        return new AuthorizationError('Permission denied', userId)
      case 'unauthenticated':
        return new AuthenticationError('User not authenticated', userId)
      case 'not-found':
        return new NotFoundError('Document', userId)
      case 'already-exists':
        return new ValidationError('Document already exists', undefined, userId)
      case 'resource-exhausted':
        return new RateLimitError('Firebase quota exceeded', userId)
      case 'unavailable':
        return new ExternalServiceError('Firebase', new Error(firebaseError.message), userId)
      default:
        return new AppError(firebaseError.message, `FIREBASE_${firebaseError.code.toUpperCase()}`, 500, true, userId, {
          firebaseCode: firebaseError.code
        })
    }
  }

  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, false, userId)
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, false, userId)
}

// Client-side error logger
export class ErrorLogger {
  private static instance: ErrorLogger
  private userId?: string

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  public logError(error: AppError | Error | unknown, context?: Record<string, unknown>): void {
    // Handle event objects that might be accidentally passed
    if (error && typeof error === 'object' && 'type' in error && 'target' in error) {
      console.warn('Event object passed to error logger. This might indicate a bug in error handling.')
      return
    }

    const errorData = {
      timestamp: new Date().toISOString(),
      userId: this.userId,
      context,
      ...(error instanceof AppError ? {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        isOperational: error.isOperational,
        errorContext: error.context
      } : error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : {
        message: 'Unknown error',
        error: String(error)
      })
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData)
    }

    // Send to monitoring service (implement based on your service)
    this.sendToMonitoring(errorData)
  }

  private sendToMonitoring(errorData: Record<string, unknown>): void {
    // Implement your monitoring service integration here
    // Examples: Sentry, LogRocket, DataDog, New Relic, etc.
    
    // For now, store in localStorage for development
    if (typeof window !== 'undefined') {
      try {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
        errors.push(errorData)
        // Keep only last 100 errors
        localStorage.setItem('app_errors', JSON.stringify(errors.slice(-100)))
      } catch (e) {
        console.warn('Failed to store error in localStorage:', e)
      }
    }
  }

  public async logUserAction(action: string, success: boolean, metadata?: Record<string, unknown>): Promise<void> {
    const actionData = {
      timestamp: new Date().toISOString(),
      userId: this.userId,
      action,
      success,
      metadata
    }

    // Log user actions for analytics
    if (typeof window !== 'undefined') {
      try {
        const actions = JSON.parse(localStorage.getItem('user_actions') || '[]')
        actions.push(actionData)
        localStorage.setItem('user_actions', JSON.stringify(actions.slice(-1000)))
      } catch (e) {
        console.warn('Failed to log user action:', e)
      }
    }
  }
}

// React hook for error handling
export function useErrorHandler() {
  const logger = ErrorLogger.getInstance()

  const handleError = (error: unknown, context?: Record<string, unknown>): AppError => {
    const appError = handleFirebaseError(error)
    logger.logError(appError, context)
    return appError
  }

  const logUserAction = (action: string, success: boolean, metadata?: Record<string, unknown>) => {
    logger.logUserAction(action, success, metadata)
  }

  return { handleError, logUserAction }
}

// Utility functions
export function isOperationalError(error: AppError): boolean {
  return error.isOperational
}

export function createErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      timestamp: error.timestamp
    }
  }
}

// Global error boundaries helper
export function getErrorDisplayMessage(error: AppError): string {
  switch (error.code) {
    case 'AUTH_ERROR':
      return 'Please sign in to continue'
    case 'AUTHORIZATION_ERROR':
      return 'You don\'t have permission to perform this action'
    case 'NOT_FOUND':
      return 'The requested resource was not found'
    case 'VALIDATION_ERROR':
      return error.message
    case 'RATE_LIMIT':
      return 'Too many requests. Please try again later'
    case 'EXTERNAL_SERVICE_ERROR':
      return 'Service temporarily unavailable. Please try again'
    default:
      return 'Something went wrong. Please try again'
  }
}

const ErrorHandling = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  handleFirebaseError,
  ErrorLogger,
  useErrorHandler,
  isOperationalError,
  createErrorResponse,
  getErrorDisplayMessage
}

export default ErrorHandling