'use client'

import { useState, useEffect } from 'react'
import { Calendar, MessageSquare, AlertCircle, Clock, Video, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface PendingItemsWidgetProps {
  onViewItem?: (type: string, itemId?: string) => void
}

interface PendingItem {
  id: string
  type: 'session_request' | 'message' | 'lesson_review' | 'video_review'
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

      // Load pending video reviews
      const videosRes = await fetch('/api/coach/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null)

      if (videosRes?.ok) {
        const data = await videosRes.json()
        const awaitingCount = data.awaitingCoach?.length || 0
        if (awaitingCount > 0) {
          items.push({
            id: 'video-reviews',
            type: 'video_review',
            title: `${awaitingCount} Video ${awaitingCount === 1 ? 'Review' : 'Reviews'}`,
            subtitle: 'Athlete videos waiting for feedback',
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
      case 'video_review':
        return Video
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
      case 'video_review':
        return '#E53E3E'
      default:
        return '#666'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>Notification Center</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  if (pendingItems.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>Notification Center</h2>
          <button
            onClick={loadPendingItems}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh</span>
          </button>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8" style={{ color: '#000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-bold mb-1" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif' }}>All caught up!</p>
          <p className="text-xs" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>No pending notifications at the moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
            Notification Center
          </h2>
          {pendingItems.length > 0 && (
            <span className="bg-black text-white text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {pendingItems.length}
            </span>
          )}
        </div>
        <button
          onClick={loadPendingItems}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}
          title="Refresh notifications"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-xs">Refresh</span>
        </button>
      </div>
      <div className="space-y-3">
        {pendingItems.map((item) => {
          const Icon = getIcon(item.type)

          return (
            <button
              key={item.id}
              onClick={() => onViewItem?.(item.type, item.id)}
              className="w-full flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-black transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-bold truncate" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
                    {item.title}
                  </p>
                  {item.urgent && (
                    <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>{item.subtitle}</p>
                <p className="text-xs mt-1" style={{ color: '#999', fontFamily: 'Open Sans, sans-serif' }}>{item.time}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
