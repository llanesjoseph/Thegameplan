'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, getDocs, Timestamp } from 'firebase/firestore'
import { Send, Loader2, Bot, User, Sparkles, MessageCircle, X, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AskCoachAIProps {
  coachId?: string
  coachName?: string
  sport?: string
  defaultOpen?: boolean
  hideLauncher?: boolean
  inlineMode?: boolean
}

export default function AskCoachAI({ coachId, coachName, sport, defaultOpen = false, hideLauncher = false, inlineMode = false }: AskCoachAIProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load messages from Firestore in real-time (no composite index required)
  useEffect(() => {
    if (!user) return

    console.log('📡 Setting up real-time chat listener')

    // Build query constraints dynamically so chat works even if coachId is not present
    const constraints: any[] = [where('userId', '==', user.uid)]
    if (coachId) constraints.push(where('coachId', '==', coachId))

    const chatQuery = query(collection(db, 'chat_messages'), ...constraints)

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const loadedMessages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        }
      }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      setMessages(loadedMessages)
      console.log('✅ Loaded', loadedMessages.length, 'messages from Firestore')
    }, (error) => {
      console.error('Error loading chat messages:', error)
    })

    return () => unsubscribe()
  }, [user, coachId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear this conversation? This cannot be undone.')) return

    if (!user || !coachId) return

    try {
      // Delete all messages for this conversation from Firestore
      const chatQuery = query(
        collection(db, 'chat_messages'),
        where('userId', '==', user.uid),
        where('coachId', '==', coachId)
      )

      const snapshot = await getDocs(chatQuery)
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      console.log('🗑️ Cleared', snapshot.docs.length, 'messages from Firestore')
    } catch (error) {
      console.error('Error clearing chat:', error)
      alert('Failed to clear chat. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading || !user || !coachId) return

    const questionText = question.trim()
    setQuestion('')
    setIsLoading(true)

    try {
      // Save user message to Firestore
      await addDoc(collection(db, 'chat_messages'), {
        userId: user.uid,
        coachId,
        role: 'user',
        content: questionText,
        timestamp: Timestamp.now()
      })

      // Get AI response
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          userId: user.uid,
          creatorId: coachId,
          creatorName: coachName,
          sport: sport
        })
      })

      const data = await response.json()

      if (data.success && data.response) {
        // Save assistant response to Firestore
        await addDoc(collection(db, 'chat_messages'), {
          userId: user.uid,
          coachId,
          role: 'assistant',
          content: data.response,
          timestamp: Timestamp.now()
        })
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error asking coach:', error)

      // Save error message to Firestore
      await addDoc(collection(db, 'chat_messages'), {
        userId: user.uid,
        coachId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: Timestamp.now()
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!inlineMode && !isOpen) {
    return (
      hideLauncher ? null : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
          style={{ backgroundColor: '#000000' }}
        >
          <Bot className="w-5 h-5 text-white" />
        </button>
      )
    )
  }

  // INLINE MODE: no fixed container/header; render just body + input, filling parent
  if (inlineMode) {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">Your past chat will appear here.</p>
              <p className="text-sm text-gray-500">Start by asking a question.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`flex-1 rounded-lg p-3 ${
                  message.role === 'user' ? 'bg-black text-white' : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-50">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#000' }} />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your coach a question..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{ backgroundColor: '#000000' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl z-40 flex flex-col border border-gray-200">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between rounded-t-xl bg-black">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-heading text-white text-sm">Ask Your Coach</h3>
            <p className="text-[10px] text-white/70">
              {coachName ? `Ask ${coachName}` : 'Ask your coach'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">Your past chat will appear here.</p>
            <p className="text-sm text-gray-500">Start by asking a question.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Minimal avatars removed to reduce visual clutter */}
            <div
              className={`flex-1 rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-50">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-sky-blue to-black">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#20B2AA' }} />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your coach a question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ backgroundColor: '#000000' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {/* Subtle legal note intentionally removed per design feedback */}
      </form>
    </div>
  )
}
