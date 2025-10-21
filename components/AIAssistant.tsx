'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Minimize2, Maximize2, X, Sparkles, Zap } from 'lucide-react'
import { createAISession, checkUserLegalCompliance } from '@/lib/ai-logging'
import AILegalDisclaimer from './AILegalDisclaimer'
import { db } from '@/lib/firebase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
 collection,
 doc,
 addDoc,
 setDoc,
 getDocs,
 query,
 where,
 orderBy,
 serverTimestamp,
 onSnapshot,
 Timestamp,
 deleteDoc
} from 'firebase/firestore'

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
 creatorId?: string
 creatorName?: string
 requireLegalConsent?: boolean
 userPhotoURL?: string
 coachPhotoURL?: string
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
 creatorId,
 creatorName,
 requireLegalConsent = true,
 userPhotoURL,
 coachPhotoURL
}) => {
 const [messages, setMessages] = useState<Message[]>([])
 const [inputValue, setInputValue] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [isMinimized, setIsMinimized] = useState(false)
 const [showDisclaimer, setShowDisclaimer] = useState(false)
 const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
 const [sessionId, setSessionId] = useState<string>('')
 const [conversationId, setConversationId] = useState<string>('')
 const [isLoadingHistory, setIsLoadingHistory] = useState(false)
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

 // Load chat history when component mounts
 useEffect(() => {
  if (userId && hasAcceptedTerms) {
   loadChatHistory()
  }
 }, [userId, hasAcceptedTerms])

 const generateConversationId = (userId: string, creatorId?: string, sport?: string): string => {
  // Use stable IDs: userId + creatorId (if available) + sport
  // This ensures the same conversation ID across sessions, regardless of context changes
  const coachPart = creatorId ? `-${creatorId}` : '-general'
  const sportSuffix = sport ? `-${sport}` : ''
  return `${userId}${coachPart}${sportSuffix}`
 }

 const loadChatHistory = async () => {
  if (!userId) return

  // ALWAYS set conversationId, even if no history exists yet
  // This ensures new messages can be saved to the correct conversation
  const convId = generateConversationId(userId, creatorId, sport)
  setConversationId(convId)

  setIsLoadingHistory(true)
  try {
   const messagesQuery = query(
    collection(db, 'chatConversations', convId, 'messages'),
    orderBy('timestamp', 'asc')
   )

   const snapshot = await getDocs(messagesQuery)
   const historicalMessages: Message[] = []

   snapshot.forEach((doc) => {
    const data = doc.data()
    historicalMessages.push({
     id: doc.id,
     type: data.type,
     content: data.content,
     timestamp: data.timestamp?.toDate() || new Date()
    })
   })

   if (historicalMessages.length > 0) {
    console.log(`✅ Loaded ${historicalMessages.length} messages from conversation: ${convId}`)
   } else {
    console.log(`📭 No chat history found for conversation: ${convId}`)
   }

   setMessages(historicalMessages)
  } catch (error) {
   console.error('Error loading chat history:', error)
  } finally {
   setIsLoadingHistory(false)
  }
 }

 const saveMessageToFirestore = async (message: Message, conversationId: string) => {
  try {
   // First ensure conversation document exists with correct ID
   const conversationRef = doc(db, 'chatConversations', conversationId)
   const conversationData = {
    userId: userId,
    lastActivity: serverTimestamp(),
    messageCount: messages.length + 1,
    sport: sport || null,
    context: context.slice(0, 200),
    title: title,
    createdAt: serverTimestamp()
   }

   // Use setDoc with merge to create or update conversation
   await setDoc(conversationRef, conversationData, { merge: true })

   // Now save the message
   const messageData = {
    type: message.type,
    content: message.content,
    timestamp: serverTimestamp(),
    userId: userId,
    sessionId: sessionId,
    sport: sport || null,
    context: context.slice(0, 100)
   }

   await addDoc(
    collection(db, 'chatConversations', conversationId, 'messages'),
    messageData
   )

  } catch (error) {
   console.error('Error saving message to Firestore:', error)
  }
 }

 const checkLegalCompliance = async () => {
  if (!userId) return

  try {
   // Check localStorage first for immediate persistence
   const TERMS_VERSION = '1.0'
   const PRIVACY_VERSION = '1.0'
   const localStorageKey = `ai_terms_accepted_${userId}_v${TERMS_VERSION}_${PRIVACY_VERSION}`

   const localAcceptance = localStorage.getItem(localStorageKey)

   if (localAcceptance === 'true') {
    // Already accepted in this browser session
    setHasAcceptedTerms(true)
    await initializeSession()
    if (initialPrompt) {
     handleSendMessage(initialPrompt)
    }
    return
   }

   // If not in localStorage, check Firestore (slower but persistent across devices)
   const compliance = await checkUserLegalCompliance(userId)
   if (compliance.needsTermsUpdate || compliance.needsPrivacyUpdate) {
    setShowDisclaimer(true)
   } else {
    // User has accepted in Firestore, cache in localStorage
    localStorage.setItem(localStorageKey, 'true')
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
    '1.0' // privacyPolicyVersion
   )
   setSessionId(newSessionId)
  } catch (error) {
   console.error('Error creating AI session:', error)
  }
 }

 const handleAcceptTerms = async () => {
  setShowDisclaimer(false)
  setHasAcceptedTerms(true)

  // Save acceptance to localStorage for immediate persistence
  if (userId) {
   const TERMS_VERSION = '1.0'
   const PRIVACY_VERSION = '1.0'
   const localStorageKey = `ai_terms_accepted_${userId}_v${TERMS_VERSION}_${PRIVACY_VERSION}`
   localStorage.setItem(localStorageKey, 'true')
  }

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

  // Save user message to Firestore
  if (userId && conversationId) {
   await saveMessageToFirestore(userMessage, conversationId)
  }

  try {
   console.log('🤖 Sending message to AI:', messageToSend)

   // Build conversation history for context (last 10 messages)
   const conversationHistory = messages.slice(-10).map(msg => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content
   }))

   // Use the new API endpoint that includes logging
   const response = await fetch('/api/ai-coaching', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     question: messageToSend,
     conversationHistory: conversationHistory, // ADD conversation history
     userId: userId,
     userEmail: userEmail,
     sessionId: sessionId,
     sport: sport,
     creatorId: creatorId, // Coach ID for voice-cloned AI persona
     creatorName: creatorName, // Coach name for context
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

   // Save assistant message to Firestore
   if (userId && conversationId) {
    await saveMessageToFirestore(assistantMessage, conversationId)
   }

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

 const clearChat = async () => {
  setMessages([])

  // Optionally clear from Firestore as well
  if (userId && conversationId) {
   try {
    const messagesQuery = query(
     collection(db, 'chatConversations', conversationId, 'messages')
    )
    const snapshot = await getDocs(messagesQuery)

    // Note: In production, consider soft-delete instead of hard delete
    // for audit trail purposes
    const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref))
    await Promise.all(deletePromises)

    console.log('✅ Chat history cleared from Firestore')
   } catch (error) {
    console.error('Error clearing chat history from Firestore:', error)
   }
  }
 }

 if (mode === 'floating' && isMinimized) {
  return (
   <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
    <button
     onClick={() => setIsMinimized(false)}
     className="w-14 h-14 bg-gradient-to-r from-sky-blue to-orange rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
     <Bot className="w-6 h-6" />
    </button>
   </div>
  )
 }

 const containerClasses = {
  inline: `bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col ${className}`,
  floating: `fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 ${className}`,
  fullscreen: `fixed inset-0 z-50 bg-white ${className}`
 }

 return (
  <div className={containerClasses[mode]}>
   {/* Header */}
   <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-sky-blue/5 to-orange/5">
    <div className="flex items-center gap-3">
     <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-orange rounded-full flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-white" />
     </div>
     <h3 className=" text-dark">{title}</h3>
    </div>
    
    <div className="flex items-center gap-2">
     {messages.length > 0 && (
      <button
       onClick={clearChat}
       className="p-1.5 text-gray-500 hover:text-dark transition-colors"
       title="Clear chat"
      >
       <X className="w-4 h-4" />
      </button>
     )}
     
     {mode === 'floating' && (
      <button
       onClick={() => setIsMinimized(true)}
       className="p-1.5 text-gray-500 hover:text-dark transition-colors"
       title="Minimize"
      >
       <Minimize2 className="w-4 h-4" />
      </button>
     )}
     
     {onClose && (
      <button
       onClick={onClose}
       className="p-1.5 text-gray-500 hover:text-dark transition-colors"
       title="Close"
      >
       <X className="w-4 h-4" />
      </button>
     )}
    </div>
   </div>

   {/* Messages */}
   <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {isLoadingHistory && (
     <div className="text-center text-gray-500 py-8">
      <div className="flex items-center justify-center gap-2 mb-3">
       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-blue)]"></div>
       <span className="text-sm">Loading chat history...</span>
      </div>
     </div>
    )}

    {!isLoadingHistory && messages.length === 0 && (
     <div className="text-center text-gray-500 py-8">
      <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="text-sm">Start a conversation with your AI assistant</p>
      {userId && (
       <p className="text-xs mt-2 opacity-70">Your conversation history will be saved</p>
      )}
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
         ? 'bg-gradient-to-r from-sky-blue to-orange text-white'
         : 'bg-gray-100 text-dark'
       }`}
      >
       <div className="flex items-start gap-2">
        {message.type === 'assistant' && (
         coachPhotoURL ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-blue">
           <img
            src={coachPhotoURL}
            alt={creatorName || 'Coach'}
            className="w-full h-full object-cover"
           />
          </div>
         ) : (
          <div className="w-8 h-8 rounded-full bg-sky-blue flex items-center justify-center flex-shrink-0">
           <Bot className="w-4 h-4 text-white" />
          </div>
         )
        )}
        <div className="flex-1">
         {message.type === 'assistant' ? (
          <div className="prose prose-sm max-w-none">
           <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
             h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4 text-dark" {...props} />,
             h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3 text-dark" {...props} />,
             h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-3 text-dark" {...props} />,
             h4: ({node, ...props}) => <h4 className="text-sm font-bold mb-1 mt-2 text-dark" {...props} />,
             p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
             ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
             ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
             li: ({node, ...props}) => <li className="ml-2" {...props} />,
             strong: ({node, ...props}) => <strong className="font-bold text-dark" {...props} />,
             em: ({node, ...props}) => <em className="italic" {...props} />,
             code: ({node, ...props}) => <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
             hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />,
             blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-sky-blue pl-3 italic my-3" {...props} />
            }}
           >
            {message.content}
           </ReactMarkdown>
          </div>
         ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
         )}
         <p className={`text-xs mt-1 opacity-70 ${
          message.type === 'user' ? 'text-white' : 'text-gray-500'
         }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </p>
        </div>
        {message.type === 'user' && (
         userPhotoURL ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white">
           <img
            src={userPhotoURL}
            alt="You"
            className="w-full h-full object-cover"
           />
          </div>
         ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-blue to-orange flex items-center justify-center flex-shrink-0">
           <User className="w-4 h-4 text-white" />
          </div>
         )
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
      className="px-4 py-2 bg-gradient-to-r from-sky-blue to-orange text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
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