'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Minimize2, Maximize2, X, Sparkles, Zap } from 'lucide-react'
import { getRobustAIResponse } from '@/lib/ai-service'
import { createAISession, checkUserLegalCompliance } from '@/lib/ai-logging'
import AILegalDisclaimer from './AILegalDisclaimer'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  context?: string
  placeholder?: string
  title?: string
  className?: string
  mode?: 'inline' | 'floating' | 'fullscreen'
  onClose?: () => void
  initialPrompt?: string
  userId?: string
  userEmail?: string
  sport?: string
  requireLegalConsent?: boolean
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  context = "You are a helpful AI assistant for a sports training platform. Help users with their questions about sports, training, coaching, and using the platform.",
  placeholder = "Ask me anything about sports training...",
  title = "AI Assistant",
  className = "",
  mode = "inline",
  onClose,
  initialPrompt,
  userId,
  userEmail,
  sport,
  requireLegalConsent = true
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (requireLegalConsent && userId && userEmail) {
      checkLegalCompliance()
    } else if (initialPrompt) {
      handleSendMessage(initialPrompt)
    }
  }, [initialPrompt, userId, userEmail, requireLegalConsent])

  const checkLegalCompliance = async () => {
    if (!userId) return

    try {
      const compliance = await checkUserLegalCompliance(userId)
      if (compliance.needsTermsUpdate || compliance.needsPrivacyUpdate) {
        setShowDisclaimer(true)
      } else {
        setHasAcceptedTerms(true)
        await initializeSession()
        if (initialPrompt) {
          handleSendMessage(initialPrompt)
        }
      }
    } catch (error) {
      console.error('Error checking legal compliance:', error)
      // Default to showing disclaimer on error
      setShowDisclaimer(true)
    }
  }

  const initializeSession = async () => {
    if (!userId || !userEmail) return

    try {
      const newSessionId = await createAISession(
        userId,
        userEmail,
'pro', // TODO: Get actual subscription level
        true, // disclaimerAccepted
        '1.0', // termsVersion
        '1.0'  // privacyPolicyVersion
      )
      setSessionId(newSessionId)
    } catch (error) {
      console.error('Error creating AI session:', error)
    }
  }

  const handleAcceptTerms = async () => {
    setShowDisclaimer(false)
    setHasAcceptedTerms(true)
    await initializeSession()
    if (initialPrompt) {
      handleSendMessage(initialPrompt)
    }
  }

  const handleDeclineTerms = () => {
    setShowDisclaimer(false)
    if (onClose) {
      onClose()
    }
  }

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend || isLoading) return

    // Check if user has accepted terms for AI coaching requests
    if (requireLegalConsent && !hasAcceptedTerms) {
      setShowDisclaimer(true)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      console.log('🤖 Sending message to AI:', messageToSend)
      
      // Use the new API endpoint that includes logging
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: messageToSend,
          userId: userId,
          userEmail: userEmail,
          sessionId: sessionId,
          sport: sport,
          disclaimerAccepted: hasAcceptedTerms,
          userConsent: hasAcceptedTerms
        }),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API call failed')
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      console.log('✅ AI response received via provider:', data.provider, 'logged:', data.logged)
    } catch (error) {
      console.error('❌ AI Assistant Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  if (mode === 'floating' && isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-gradient-to-r from-[var(--primary-blue)] to-[var(--accent-indigo)] rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    )
  }

  const containerClasses = {
    inline: `bg-white rounded-xl shadow-lg border border-[var(--light-gray)] ${className}`,
    floating: `fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-[var(--light-gray)] ${className}`,
    fullscreen: `fixed inset-0 z-50 bg-white ${className}`
  }

  return (
    <div className={containerClasses[mode]}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--light-gray)] bg-gradient-to-r from-[var(--primary-blue)]/5 to-[var(--accent-indigo)]/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[var(--primary-blue)] to-[var(--accent-indigo)] rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-[var(--deep-black)]">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-[var(--mid-gray)] hover:text-[var(--deep-black)] transition-colors"
              title="Clear chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {mode === 'floating' && (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-[var(--mid-gray)] hover:text-[var(--deep-black)] transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--mid-gray)] hover:text-[var(--deep-black)] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: mode === 'inline' ? '400px' : 'calc(100% - 140px)' }}>
        {messages.length === 0 && (
          <div className="text-center text-[var(--mid-gray)] py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 text-[var(--light-gray)]" />
            <p className="text-sm">Start a conversation with your AI assistant</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-[var(--primary-blue)] to-[var(--accent-indigo)] text-white'
                  : 'bg-[var(--light-gray)] text-[var(--deep-black)]'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 text-[var(--primary-blue)]" />
                )}
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.type === 'user' ? 'text-white' : 'text-[var(--mid-gray)]'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.type === 'user' && (
                  <User className="w-4 h-4 mt-0.5" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-[var(--light-gray)]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[var(--primary-blue)]" />
                <div className="flex space-x-1">
                  {[0, 0.1, 0.2].map((delay, index) => (
                    <div 
                      key={index}
                      className="w-2 h-2 bg-[var(--mid-gray)] rounded-full animate-bounce" 
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--light-gray)]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-[var(--light-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-[var(--primary-blue)] to-[var(--accent-indigo)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legal Disclaimer Modal */}
      {showDisclaimer && (
        <AILegalDisclaimer
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
          userEmail={userEmail}
          showFullDisclaimer={true}
        />
      )}
    </div>
  )
}

export default AIAssistant