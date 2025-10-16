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
}

export default function AskCoachAI({ coachId, coachName, sport }: AskCoachAIProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load messages from Firestore in real-time
  useEffect(() => {
    if (!user || !coachId) return

    console.log('📡 Setting up real-time chat listener for user:', user.uid, 'coach:', coachId)

    const chatQuery = query(
      collection(db, 'chat_messages'),
      where('userId', '==', user.uid),
      where('coachId', '==', coachId),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const loadedMessages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        }
      })

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        style={{ backgroundColor: '#20B2AA' }}
      >
        <Bot className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between rounded-t-xl" style={{ backgroundColor: '#20B2AA' }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-white">AI Coach</h3>
            <p className="text-xs text-white/80">
              {coachName ? `Ask ${coachName}` : 'Ask your coach'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#E8E6D8' }}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
              <MessageCircle className="w-8 h-8" style={{ color: '#20B2AA' }} />
            </div>
            <p className="text-gray-600 mb-2">Ask your AI coach anything!</p>
            <p className="text-sm text-gray-500">Get instant answers about training, technique, and strategy</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user'
                ? 'bg-black'
                : 'bg-gradient-to-br from-sky-blue to-black'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
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
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your coach a question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ backgroundColor: '#20B2AA' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI-powered coaching assistance • Not medical advice
        </p>
      </form>
    </div>
  )
}
