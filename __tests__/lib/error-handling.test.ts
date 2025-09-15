import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  handleFirebaseError,
  ErrorLogger,
  getErrorDisplayMessage
} from '@/lib/error-handling'
import { FirebaseError } from 'firebase/app'

describe('AppError Classes', () => {
  it('creates AppError with correct properties', () => {
    const error = new AppError(
      'Test error',
      'TEST_ERROR',
      400,
      true,
      'user123',
      { context: 'test' }
    )

    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.isOperational).toBe(true)
    expect(error.userId).toBe('user123')
    expect(error.context).toEqual({ context: 'test' })
    expect(error.timestamp).toBeInstanceOf(Date)
  })

  it('creates ValidationError with correct defaults', () => {
    const error = new ValidationError('Invalid input', 'email')

    expect(error.message).toBe('Invalid input')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.isOperational).toBe(true)
    expect(error.context).toEqual({ field: 'email' })
  })

  it('creates AuthenticationError with default message', () => {
    const error = new AuthenticationError()

    expect(error.message).toBe('Authentication required')
    expect(error.code).toBe('AUTH_ERROR')
    expect(error.statusCode).toBe(401)
  })

  it('creates NotFoundError with resource name', () => {
    const error = new NotFoundError('User')

    expect(error.message).toBe('User not found')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.statusCode).toBe(404)
  })
})

describe('handleFirebaseError', () => {
  it('handles permission-denied Firebase error', () => {
    const firebaseError = {
      code: 'permission-denied',
      message: 'Permission denied'
    } as FirebaseError

    const error = handleFirebaseError(firebaseError, 'user123')

    expect(error).toBeInstanceOf(AuthorizationError)
    expect(error.userId).toBe('user123')
  })

  it('handles unauthenticated Firebase error', () => {
    const firebaseError = {
      code: 'unauthenticated',
      message: 'Unauthenticated'
    } as FirebaseError

    const error = handleFirebaseError(firebaseError)

    expect(error).toBeInstanceOf(AuthenticationError)
  })

  it('handles not-found Firebase error', () => {
    const firebaseError = {
      code: 'not-found',
      message: 'Document not found'
    } as FirebaseError

    const error = handleFirebaseError(firebaseError)

    expect(error).toBeInstanceOf(NotFoundError)
  })

  it('handles resource-exhausted Firebase error', () => {
    const firebaseError = {
      code: 'resource-exhausted',
      message: 'Quota exceeded'
    } as FirebaseError

    const error = handleFirebaseError(firebaseError)

    expect(error).toBeInstanceOf(RateLimitError)
  })

  it('handles unavailable Firebase error', () => {
    const firebaseError = {
      code: 'unavailable',
      message: 'Service unavailable'
    } as FirebaseError

    const error = handleFirebaseError(firebaseError)

    expect(error).toBeInstanceOf(ExternalServiceError)
  })

  it('handles unknown Firebase error', () => {
    const firebaseError = {
      code: 'unknown-code',
      message: 'Unknown error'
    } as FirebaseError

    const error = handleFirebaseError(firebaseError)

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('FIREBASE_UNKNOWN-CODE')
  })

  it('handles generic Error', () => {
    const genericError = new Error('Generic error')

    const error = handleFirebaseError(genericError)

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.isOperational).toBe(false)
  })

  it('handles unknown error type', () => {
    const error = handleFirebaseError('string error')

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.isOperational).toBe(false)
  })
})

describe('ErrorLogger', () => {
  let errorLogger: ErrorLogger
  let mockLocalStorage: { [key: string]: string } = {}

  beforeEach(() => {
    errorLogger = ErrorLogger.getInstance()
    mockLocalStorage = {}
    
    // Mock localStorage behavior
    ;(localStorage.getItem as jest.Mock).mockImplementation((key: string) => mockLocalStorage[key] || null)
    ;(localStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value
    })
    ;(localStorage.clear as jest.Mock).mockImplementation(() => {
      mockLocalStorage = {}
    })
    
    jest.clearAllMocks()
  })

  it('is a singleton', () => {
    const instance1 = ErrorLogger.getInstance()
    const instance2 = ErrorLogger.getInstance()

    expect(instance1).toBe(instance2)
  })

  it('sets user ID', () => {
    errorLogger.setUserId('user123')
    
    // Test that userId is set by checking a logged error
    const appError = new AppError('Test error')
    errorLogger.logError(appError)

    const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
    expect(storedErrors[0].userId).toBe('user123')
  })

  it('logs AppError correctly', () => {
    const appError = new AppError('Test error', 'TEST_ERROR', 400)
    errorLogger.logError(appError, { context: 'test' })

    const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
    const loggedError = storedErrors[0]

    expect(loggedError.message).toBe('Test error')
    expect(loggedError.code).toBe('TEST_ERROR')
    expect(loggedError.statusCode).toBe(400)
    expect(loggedError.context).toEqual({ context: 'test' })
  })

  it('logs generic Error correctly', () => {
    const error = new Error('Generic error')
    errorLogger.logError(error)

    const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
    const loggedError = storedErrors[0]

    expect(loggedError.message).toBe('Generic error')
    expect(loggedError.name).toBe('Error')
  })

  it('logs user action correctly', async () => {
    errorLogger.setUserId('user123')
    await errorLogger.logUserAction('button_click', true, { button: 'subscribe' })

    const storedActions = JSON.parse(localStorage.getItem('user_actions') || '[]')
    const loggedAction = storedActions[0]

    expect(loggedAction.action).toBe('button_click')
    expect(loggedAction.success).toBe(true)
    expect(loggedAction.userId).toBe('user123')
    expect(loggedAction.metadata).toEqual({ button: 'subscribe' })
  })
})

describe('getErrorDisplayMessage', () => {
  it('returns correct message for AUTH_ERROR', () => {
    const error = new AuthenticationError()
    const message = getErrorDisplayMessage(error)
    expect(message).toBe('Please sign in to continue')
  })

  it('returns correct message for AUTHORIZATION_ERROR', () => {
    const error = new AuthorizationError()
    const message = getErrorDisplayMessage(error)
    expect(message).toBe('You don\'t have permission to perform this action')
  })

  it('returns correct message for NOT_FOUND', () => {
    const error = new NotFoundError('User')
    const message = getErrorDisplayMessage(error)
    expect(message).toBe('The requested resource was not found')
  })

  it('returns validation error message for VALIDATION_ERROR', () => {
    const error = new ValidationError('Email is required')
    const message = getErrorDisplayMessage(error)
    expect(message).toBe('Email is required')
  })

  it('returns default message for unknown error code', () => {
    const error = new AppError('Unknown error', 'UNKNOWN_CODE')
    const message = getErrorDisplayMessage(error)
    expect(message).toBe('Something went wrong. Please try again')
  })
})