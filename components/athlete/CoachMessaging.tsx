'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Send, Loader2, User, MessageSquare, X, Check, CheckCheck } from 'lucide-react'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore'

interface Message {
  id: string
  senderId: string
  senderName: string
  recipientId: string
  content: string
  timestamp: any
  read: boolean
}

interface CoachMessagingProps {
  coachId: string
  coachName: string
  coachAvatar?: string
}

export default function CoachMessaging({ coachId, coachName, coachAvatar }: CoachMessagingProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Listen to messages in real-time
  useEffect(() => {
    if (!user?.uid || !coachId) return

    const messagesRef = collection(db, 'messages')
    const q = query(
      messagesRef,
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = []
      let unread = 0

      snapshot.forEach((doc) => {
        const data = doc.data()
        // Only show messages between this athlete and their coach
        if (
          (data.senderId === user.uid && data.recipientId === coachId) ||
          (data.senderId === coachId && data.recipientId === user.uid)
        ) {
          newMessages.push({
            id: doc.id,
            ...data
          } as Message)

          // Count unread messages from coach
          if (data.senderId === coachId && !data.read) {
            unread++
          }
        }
      })

      setMessages(newMessages)
      setUnreadCount(unread)

      // Mark messages as read when chat is open
      if (isOpen) {
        markMessagesAsRead()
      }
    })

    return () => unsubscribe()
  }, [user?.uid, coachId, isOpen])

  const markMessagesAsRead = async () => {
    if (!user?.uid) return

    const unreadMessages = messages.filter(
      m => m.senderId === coachId && !m.read
    )

    for (const message of unreadMessages) {
      try {
        await updateDoc(doc(db, 'messages', message.id), {
          read: true
        })
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading || !user?.uid) return

    setIsLoading(true)

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Athlete',
        recipientId: coachId,
        recipientName: coachName,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        participants: [user.uid, coachId]
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          markMessagesAsRead()
        }}
        className="fixed bottom-6 left-6 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group relative"
        style={{ backgroundColor: '#91A6EB' }}
      >
        <MessageSquare className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange rounded-full flex items-center justify-center text-white text-xs">
            {unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between rounded-t-xl" style={{ backgroundColor: '#91A6EB' }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {coachAvatar ? (
              <img src={coachAvatar} alt={coachName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-heading text-white">{coachName}</h3>
            <p className="text-xs text-white/80">Your Coach</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#E8E6D8' }}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
              <MessageSquare className="w-8 h-8" style={{ color: '#91A6EB' }} />
            </div>
            <p className="text-gray-600 mb-2">No messages yet</p>
            <p className="text-sm text-gray-500">Send your coach a message to get started</p>
          </div>
        )}

        {messages.map((message) => {
          const isFromMe = message.senderId === user?.uid

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isFromMe
                  ? 'bg-black'
                  : 'bg-gradient-to-br from-purple-400 to-blue-500'
              }`}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div
                className={`flex-1 max-w-[75%] rounded-lg p-3 ${
                  isFromMe
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs opacity-50">
                    {message.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
                  </p>
                  {isFromMe && (
                    <span className="ml-1">
                      {message.read ? (
                        <CheckCheck className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Check className="w-3 h-3 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ backgroundColor: '#91A6EB' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Messages are private between you and your coach
        </p>
      </form>
    </div>
  )
}
