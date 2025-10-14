'use client'

import { GraduationCap, Calendar, MessageSquare, Bell, Users, Video } from 'lucide-react'

interface QuickActionsPanelProps {
  onAction: (action: string) => void
}

export default function QuickActionsPanel({ onAction }: QuickActionsPanelProps) {
  const quickActions = [
    {
      id: 'create-lesson',
      label: 'Create Lesson',
      icon: GraduationCap,
      color: '#20B2AA',
      description: 'Build new training'
    },
    {
      id: 'schedule-session',
      label: 'Schedule Session',
      icon: Calendar,
      color: '#16A34A',
      description: 'Add to calendar'
    },
    {
      id: 'post-update',
      label: 'Post Update',
      icon: MessageSquare,
      color: '#91A6EB',
      description: 'Share with athletes'
    },
    {
      id: 'send-announcement',
      label: 'Announcement',
      icon: Bell,
      color: '#FF6B35',
      description: 'Notify all athletes'
    },
    {
      id: 'view-athletes',
      label: 'My Athletes',
      icon: Users,
      color: '#91A6EB',
      description: 'Manage athletes'
    },
    {
      id: 'add-video',
      label: 'Add Video',
      icon: Video,
      color: '#FF6B35',
      description: 'Upload content'
    }
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-200 touch-manipulation active:scale-95"
              style={{ minHeight: '100px' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: action.color }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
