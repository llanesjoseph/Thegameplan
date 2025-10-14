'use client'

import { useState, useEffect } from 'react'
import { Calendar, MessageSquare, AlertCircle, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface PendingItemsWidgetProps {
  onViewItem?: (type: string, itemId?: string) => void
}

interface PendingItem {
  id: string
  type: 'session_request' | 'message' | 'lesson_review'
  title: string
  subtitle: string
  time: string
  urgent?: boolean
}

export default function PendingItemsWidget({ onViewItem }: PendingItemsWidgetProps) {
  const { user } = useAuth()
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      loadPendingItems()
    }
  }, [user])

  const loadPendingItems = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()

      // Load pending live session requests
      const sessionsRes = await fetch('/api/coach/live-sessions/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null)

      const items: PendingItem[] = []

      if (sessionsRes?.ok) {
        const data = await sessionsRes.json()
        if (data.pendingCount > 0) {
          items.push({
            id: 'session-requests',
            type: 'session_request',
            title: `${data.pendingCount} Live Session ${data.pendingCount === 1 ? 'Request' : 'Requests'}`,
            subtitle: 'Athletes waiting for your response',
            time: 'Pending',
            urgent: true
          })
        }
      }

      // TODO: Load other pending items (messages, lesson reviews, etc.)

      setPendingItems(items)
    } catch (error) {
      console.error('Error loading pending items:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_request':
        return Calendar
      case 'message':
        return MessageSquare
      case 'lesson_review':
        return Clock
      default:
        return AlertCircle
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'session_request':
        return '#16A34A'
      case 'message':
        return '#91A6EB'
      case 'lesson_review':
        return '#FF6B35'
      default:
        return '#666'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Items</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    )
  }

  if (pendingItems.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Items</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">All caught up!</p>
          <p className="text-xs text-gray-500 mt-1">No pending items at the moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Pending Items
        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {pendingItems.length}
        </span>
      </h2>
      <div className="space-y-3">
        {pendingItems.map((item) => {
          const Icon = getIcon(item.type)
          const color = getColor(item.type)

          return (
            <button
              key={item.id}
              onClick={() => onViewItem?.(item.type, item.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-gray-200 text-left touch-manipulation"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.title}
                  </p>
                  {item.urgent && (
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
