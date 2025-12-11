'use client'

import { useState } from 'react'
import { MessageCircle, Lock, Shield, CheckCircle, X } from 'lucide-react'

export default function MessagingComingSoon() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group relative"
        style={{ backgroundColor: '#91A6EB' }}
      >
        <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-900">!</span>
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between rounded-t-xl" style={{ backgroundColor: '#91A6EB' }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-white">Direct Messaging</h3>
            <p className="text-xs text-white/80">Coming Soon</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
            <Lock className="w-10 h-10" style={{ color: '#91A6EB' }} />
          </div>
          <h3 className="text-xl text-gray-900 mb-2">Coming Soon!</h3>
          <p className="text-sm text-gray-600">
            Direct messaging with your coach is currently in development
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Safety First</p>
              <p className="text-xs text-gray-600">All messages monitored for your protection</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Private & Secure</p>
              <p className="text-xs text-gray-600">Direct communication with your coach</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Read Receipts</p>
              <p className="text-xs text-gray-600">Know when your coach has seen your message</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900">
            <strong>In the meantime:</strong> Use the AI Coach button (bottom-right) to ask questions and get instant answers!
          </p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full px-4 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg"
          style={{ backgroundColor: '#91A6EB' }}
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
