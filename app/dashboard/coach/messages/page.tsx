'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import CoachMessages from '@/components/coach/CoachMessages'

export default function CoachMessagesPage() {
  const { user } = useAuth()
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    // Check if we're in an iframe
    setIsEmbedded(window.self !== window.top)
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isEmbedded ? 'white' : '#E8E6D8' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: isEmbedded ? 'white' : '#E8E6D8' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Incoming Messages
          </h1>
          <p className="text-gray-600">
            View and respond to messages from your athletes
          </p>
        </div>

        {/* Messages Component */}
        <CoachMessages />
      </div>
    </div>
  )
}
