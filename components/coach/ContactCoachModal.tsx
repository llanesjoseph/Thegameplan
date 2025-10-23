'use client'

import React, { useState, useEffect } from 'react'
import { X, Send, User, MessageSquare } from 'lucide-react'

interface ContactCoachModalProps {
  isOpen: boolean
  onClose: () => void
  coachId: string
  coachName: string
  athleteId?: string
}

export default function ContactCoachModal({
  isOpen,
  onClose,
  coachId,
  coachName,
  athleteId
}: ContactCoachModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    // Subject validation
    if (!subject.trim()) {
      errors.subject = 'Subject is required'
    } else if (subject.trim().length < 3) {
      errors.subject = 'Subject must be at least 3 characters'
    } else if (subject.trim().length > 100) {
      errors.subject = 'Subject must be less than 100 characters'
    }
    
    // Message validation
    if (!message.trim()) {
      errors.message = 'Message is required'
    } else if (message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    } else if (message.trim().length > 1000) {
      errors.message = 'Message must be less than 1000 characters'
    }
    
    // Check for potentially harmful content
    const harmfulPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ]
    
    if (harmfulPatterns.some(pattern => pattern.test(subject + message))) {
      errors.content = 'Message contains potentially harmful content'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError('')
    setValidationErrors({})
    
    // Validate form
    if (!validateForm()) {
      return
    }

    if (!athleteId) {
      setError('You must be logged in to contact a coach')
      return
    }

    if (!coachId) {
      setError('Coach information is missing')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/athlete/contact-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          athleteId,
          coachId,
          subject: subject.trim(),
          message: message.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setSubject('')
        setMessage('')
        setValidationErrors({})
        setError('')
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 3000)
      } else {
        setError(data.error || 'Failed to send message. Please try again.')
      }
    } catch (err) {
      console.error('Contact coach error:', err)
      if (err instanceof Error) {
        setError(`Network error: ${err.message}`)
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubject('')
      setMessage('')
      setError('')
      setValidationErrors({})
      setSuccess(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Coach</h3>
              <p className="text-sm text-gray-600">{coachName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h4>
              <p className="text-gray-600">
                Your message has been sent to {coachName}. They'll respond through the platform.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value)
                    if (validationErrors.subject) {
                      setValidationErrors(prev => ({ ...prev, subject: '' }))
                    }
                  }}
                  placeholder="e.g., Training question about technique"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    validationErrors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  maxLength={100}
                  disabled={isSubmitting}
                />
                {validationErrors.subject && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{subject.length}/100 characters</p>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (validationErrors.message) {
                      setValidationErrors(prev => ({ ...prev, message: '' }))
                    }
                  }}
                  placeholder="Ask your question or share your training goals..."
                  rows={5}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                    validationErrors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  maxLength={1000}
                  disabled={isSubmitting}
                />
                {validationErrors.message && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.message}</p>
                )}
                {validationErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{message.length}/1000 characters</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  <strong>Privacy Protected:</strong> Your message will be sent through the platform. 
                  The coach's email address is not shared.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
