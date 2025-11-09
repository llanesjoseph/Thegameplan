'use client'

import { Video, FileVideo } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const quickActions: QuickAction[] = [
  {
    id: 'video-reviews',
    label: 'Video Reviews',
    icon: Video,
    color: '#E53E3E',
    description: 'View coach feedback'
  },
  {
    id: 'submit-video',
    label: 'Submit Video',
    icon: FileVideo,
    color: '#F97316',
    description: 'Upload for review'
  }
]

interface AthleteQuickActionsProps {
  onAction?: (actionId: string) => void
}

export default function AthleteQuickActions({ onAction }: AthleteQuickActionsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams?.get('embedded') === 'true'

  const handleAction = (actionId: string) => {
    if (onAction) {
      onAction(actionId)
      return
    }

    // If embedded in iframe, send message to parent to change section
    if (isEmbedded && window.parent !== window) {
      // Map action IDs to section IDs that the parent dashboard understands
      const sectionMap: Record<string, string> = {
        'video-reviews': 'video-reviews',
        'submit-video': 'video-reviews' // Both go to video reviews section
      }

      const sectionId = sectionMap[actionId]
      if (sectionId) {
        // Send message to parent to change the active section
        window.parent.postMessage(
          { type: 'CHANGE_SECTION', section: sectionId },
          window.location.origin
        )
      }
      return
    }

    // Not embedded - do regular navigation
    const routes: Record<string, string> = {
      'video-reviews': '/dashboard/athlete/reviews',
      'submit-video': '/dashboard/athlete/submit-video'
    }

    const route = routes[actionId]
    if (route) {
      router.push(route)
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
