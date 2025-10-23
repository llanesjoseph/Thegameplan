'use client'

import React, { useState, useEffect } from 'react'
import { Mail, Clock, User, MessageSquare, CheckCircle, Reply } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Message {
  id: string
  athleteId: string
  athleteName: string
  athleteEmail: string
  coachId: string
  coachName: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied'
  createdAt: Date
  readAt?: Date
  repliedAt?: Date
}

interface CoachMessagesProps {
  className?: string
}

export default function CoachMessages({ className = '' }: CoachMessagesProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    if (user?.uid) {
      fetchMessages()
    }
  }, [user?.uid])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/coach/messages?coachId=${user?.uid}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages)
      } else {
        setError(data.error || 'Failed to fetch messages')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/coach/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId,
          action: 'mark_read'
        })
      })

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'read' as const, readAt: new Date() }
            : msg
        ))
      }
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  const markAsReplied = async (messageId: string) => {
    try {
      const response = await fetch('/api/coach/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId,
          action: 'mark_replied'
        })
      })

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'replied' as const, repliedAt: new Date() }
            : msg
        ))
      }
    } catch (err) {
      console.error('Error marking message as replied:', err)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'replied':
        return <Reply className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'border-l-blue-500 bg-blue-50'
      case 'read':
        return 'border-l-green-500 bg-green-50'
      case 'replied':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-300 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Incoming Messages</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Incoming Messages</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchMessages}
            className="mt-2 text-teal-600 hover:text-teal-700 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Incoming Messages</h3>
            {messages.length > 0 && (
              <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-full">
                {messages.filter(m => m.status === 'unread').length} new
              </span>
            )}
          </div>
          <button 
            onClick={fetchMessages}
            className="text-teal-600 hover:text-teal-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Messages from athletes will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${getStatusColor(message.status)}`}
                onClick={() => {
                  setSelectedMessage(message)
                  if (message.status === 'unread') {
                    markAsRead(message.id)
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 truncate">
                        {message.athleteName}
                      </span>
                      {getStatusIcon(message.status)}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1 truncate">
                      {message.subject}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Message Details</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-900">{selectedMessage.athleteName}</span>
                  <span className="text-sm text-gray-500">({selectedMessage.athleteEmail})</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {selectedMessage.createdAt.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Subject</h4>
                <p className="text-gray-700">{selectedMessage.subject}</p>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    markAsReplied(selectedMessage.id)
                    setSelectedMessage(null)
                  }}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Mark as Replied
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
