'use client'

/**
 * Coach Home / Today Dashboard
 * Landing page that shows daily overview, quick actions, and pending items
 */

import { useRouter, useSearchParams } from 'next/navigation'
import TodaysOverview from '@/components/coach/TodaysOverview'
import PendingItemsWidget from '@/components/coach/PendingItemsWidget'
import TodaysSchedule from '@/components/coach/TodaysSchedule'

export default function CoachHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embedded') === 'true'

  // Handle navigation to different sections
  const handleQuickAction = (action: string) => {
    // Map actions to their corresponding routes
    const actionMap: Record<string, string> = {
      'create-lesson': '/dashboard/coach/lessons/create',
      'schedule-session': '/dashboard/coach/schedule',
      'post-update': '/dashboard/coach/feed',
      'send-announcement': '/dashboard/coach/announcements',
      'view-athletes': '/dashboard/coach/athletes',
      'add-video': '/dashboard/coach/videos',
      'live-sessions': '/dashboard/coach/live-sessions'
    }

    const route = actionMap[action]
    if (route) {
      if (isEmbedded) {
        // If embedded in unified dashboard, open in same frame
        router.push(`${route}?embedded=true`)
      } else {
        router.push(route)
      }
    }
  }

  const handleViewPendingItem = (type: string, itemId?: string) => {
    if (type === 'session_request' || itemId === 'session-requests') {
      handleQuickAction('live-sessions')
    }
    // Handle other types as needed
  }

  const handleAddEvent = () => {
    handleQuickAction('schedule-session')
  }

  const handleViewEvent = (eventId: string) => {
    handleQuickAction('schedule-session')
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: isEmbedded ? 'white' : '#E8E6D8' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Overview with Integrated Quick Actions */}
        <TodaysOverview onQuickAction={handleQuickAction} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Items */}
          <PendingItemsWidget onViewItem={handleViewPendingItem} />

          {/* Today's Schedule */}
          <TodaysSchedule
            onAddEvent={handleAddEvent}
            onViewEvent={handleViewEvent}
          />
        </div>

        {/* Helpful Tips */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-2">💡 Quick Tip</h3>
          <p className="text-slate-200 text-sm">
            Use the sidebar to access all your coaching tools. The quick action buttons in the header banner provide fast access to common tasks.
            Your pending items and today's schedule will keep you organized throughout the day.
          </p>
        </div>
      </div>
    </div>
  )
}
