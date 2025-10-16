'use client'

import { GraduationCap, Calendar, MessageSquare, Users, Video } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface TodaysOverviewProps {
  onQuickAction?: (action: string) => void
}

export default function TodaysOverview({ onQuickAction }: TodaysOverviewProps) {
  const { user } = useAuth()

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const greeting = () => {
    const hour = today.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const quickActions = [
    {
      id: 'create-lesson',
      label: 'Create Lesson',
      icon: GraduationCap,
      description: 'Build new training'
    },
    {
      id: 'schedule-session',
      label: 'Schedule Session',
      icon: Calendar,
      description: 'Add to calendar'
    },
    {
      id: 'post-update',
      label: 'Post Update',
      icon: MessageSquare,
      description: 'Share with athletes'
    },
    {
      id: 'view-athletes',
      label: 'My Athletes',
      icon: Users,
      description: 'Manage athletes'
    },
    {
      id: 'add-video',
      label: 'Add Video',
      icon: Video,
      description: 'Upload content'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Greeting */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          {greeting()}, {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
        </h1>
        <p className="text-teal-50 text-sm sm:text-base">{formattedDate}</p>

        {/* Expanded Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => onQuickAction?.(action.id)}
                className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all hover:scale-105 active:scale-95 touch-manipulation border border-white/20 hover:border-white/40 text-left"
                style={{ minHeight: '100px' }}
              >
                <div className="flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {action.label}
                  </h3>
                  <p className="text-teal-50 text-xs opacity-90">
                    {action.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
