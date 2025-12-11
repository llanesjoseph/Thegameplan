/**
 * Production-Safe Logger
 * Only logs in development, silent in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  info(...args: any[]) {
    if (this.isDevelopment) {
      console.log('[INFO]', ...args)
    }
  }

  warn(...args: any[]) {
    if (this.isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  }

  error(...args: any[]) {
    // Always log errors, but send to monitoring in production
    console.error('[ERROR]', ...args)
    
    if (!this.isDevelopment && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(args[0])
    }
  }

  debug(...args: any[]) {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  }
}

export const logger = new Logger()
