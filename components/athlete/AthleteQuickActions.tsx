'use client'

import { BookOpen, Video, Calendar, MessageCircle, Sparkles, Rss } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const quickActions: QuickAction[] = [
  {
    id: 'lessons',
    label: 'View Lessons',
    icon: BookOpen,
    color: '#7B92C4',
    description: 'Start training'
  },
  {
    id: 'ask-coach',
    label: 'Ask Coach',
    icon: Sparkles,
    color: '#5A9B9B',
    description: 'Get AI assistance'
  },
  {
    id: 'video-review',
    label: 'Video Review',
    icon: Video,
    color: '#C4886A',
    description: 'Submit for feedback'
  },
  {
    id: 'schedule-session',
    label: 'Schedule Session',
    icon: Calendar,
    color: '#5A9A70',
    description: 'Book 1-on-1 time'
  },
  {
    id: 'coach-feed',
    label: "Coach's Feed",
    icon: Rss,
    color: '#5A9B9B',
    description: 'Latest updates'
  },
  {
    id: 'coach-schedule',
    label: "Coach's Schedule",
    icon: Calendar,
    color: '#5A9A70',
    description: 'Upcoming events'
  }
]

interface AthleteQuickActionsProps {
  onAction?: (actionId: string) => void
}

export default function AthleteQuickActions({ onAction }: AthleteQuickActionsProps) {
  const router = useRouter()

  const handleAction = (actionId: string) => {
    if (onAction) {
      onAction(actionId)
    } else {
      // Default navigation
      const routes: Record<string, string> = {
        'lessons': '/dashboard/athlete-lessons',
        'ask-coach': '/dashboard/athlete?section=ai-assistant',
        'video-review': '/dashboard/athlete?section=video-review',
        'schedule-session': '/dashboard/athlete?section=live-session',
        'coach-feed': '/dashboard/athlete?section=coach-feed',
        'coach-schedule': '/dashboard/athlete?section=coach-schedule'
      }

      const route = routes[actionId]
      if (route) {
        router.push(route)
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
        Quick Actions
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Jump to common training activities
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md active:scale-95 touch-manipulation group"
              style={{ minHeight: '44px' }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: action.color }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
