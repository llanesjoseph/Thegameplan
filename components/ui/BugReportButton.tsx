'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bug, Send, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info'
  message: string
  timestamp: string
}

export default function BugReportButton() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const consoleLogsRef = useRef<ConsoleLog[]>([])

  // Don't render in embedded iframes
  const isEmbedded = searchParams?.get('embedded') === 'true'
  if (isEmbedded) {
    return null
  }

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    const safeStringify = (obj: any): string => {
      try {
        // Handle DOM elements and circular references
        if (obj instanceof Element || obj instanceof Node) {
          return `[DOM ${obj.constructor.name}]`
        }

        // Try normal stringify with circular reference handling
        const seen = new WeakSet()
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]'
            }
            seen.add(value)
          }
          return value
        }, 2)
      } catch (error) {
        return String(obj)
      }
    }

    const captureLog = (type: 'log' | 'error' | 'warn' | 'info', ...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? safeStringify(arg) : String(arg)
      ).join(' ')

      const logEntry: ConsoleLog = {
        type,
        message,
        timestamp: new Date().toISOString()
      }

      consoleLogsRef.current = [...consoleLogsRef.current.slice(-99), logEntry] // Keep last 100 logs
    }

    console.log = (...args: any[]) => {
      captureLog('log', ...args)
      originalLog.apply(console, args)
    }

    console.error = (...args: any[]) => {
      captureLog('error', ...args)
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      captureLog('warn', ...args)
      originalWarn.apply(console, args)
    }

    console.info = (...args: any[]) => {
      captureLog('info', ...args)
      originalInfo.apply(console, args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      console.info = originalInfo
    }
  }, [])

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('Please describe the issue')
      return
    }

    setSending(true)
    try {
      // Get current logs
      const logs = consoleLogsRef.current

      // Capture current page info
      const pageInfo = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous'
      }

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          consoleLogs: logs,
          pageInfo
        })
      })

      if (response.ok) {
        alert('Bug report sent successfully! Thank you for your feedback.')
        setDescription('')
        setIsOpen(false)
      } else {
        alert('Failed to send bug report. Please try again.')
      }
    } catch (error) {
      console.error('Error sending bug report:', error)
      alert('Failed to send bug report. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating Bug Report Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 z-50 bg-gradient-to-r from-orange to-orange/90 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-orange/50"
        title="Report a bug"
        aria-label="Report a bug"
      >
        <Bug className="w-6 h-6" />
      </button>

      {/* Bug Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Header */}
            <div className="p-6 border-b border-dark/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange to-orange/90 rounded-xl flex items-center justify-center">
                    <Bug className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl text-dark">Report a Bug</h2>
                    <p className="text-sm text-dark/60">Help us improve the app</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-dark/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dark/60" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  What's the issue?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what went wrong, what you expected to happen, and any steps to reproduce..."
                  className="w-full border-2 border-sky-blue/20 bg-white rounded-xl p-4 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all resize-none"
                  rows={6}
                />
              </div>

              <div className="bg-cream/30 rounded-xl p-4">
                <div className="flex items-start gap-2 text-sm text-dark/70">
                  <svg className="w-5 h-5 text-sky-blue mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    This report will include console logs, your current page URL, and browser information to help us debug the issue.
                    {user && ` Sending as ${user.email}`}
                  </p>
                </div>
              </div>

              {/* Console Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-dark">
                    Recent Console Logs ({consoleLogsRef.current.length})
                  </label>
                  <button
                    onClick={() => setConsoleLogs([...consoleLogsRef.current])}
                    className="text-xs text-sky-blue hover:underline"
                  >
                    View Logs
                  </button>
                </div>
                {consoleLogs.length > 0 && (
                  <div className="bg-dark/5 rounded-xl p-4 max-h-48 overflow-y-auto font-mono text-xs">
                    {consoleLogs.slice(-20).map((log, index) => (
                      <div
                        key={index}
                        className={`mb-1 ${
                          log.type === 'error' ? 'text-red-600' :
                          log.type === 'warn' ? 'text-orange' :
                          log.type === 'info' ? 'text-sky-blue' :
                          'text-dark/70'
                        }`}
                      >
                        <span className="text-dark/40">[{log.type}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-dark/10 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-sky-blue/20 text-dark rounded-xl hover:bg-sky-blue/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={sending || !description.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-blue to-sky-blue/90 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}